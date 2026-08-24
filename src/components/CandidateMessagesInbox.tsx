import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Linkedin, CalendarClock, FileEdit, ExternalLink, Wrench, CheckCircle, XCircle, MessageSquare, History, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logError } from "@/lib/errorLogger";
import { toast } from "sonner";

interface Message {
  id: string;
  match_result_id: string;
  candidate_user_id: string;
  employer_user_id: string;
  type: 'linkedin_request' | 'profile_completion' | 'interview_invite' | 'interview_response' | 'tools_completion_request' | 'employer_reply';
  content: string;
  metadata: any;
  read_at: string | null;
  created_at: string;
}

const iconForType = (type: string) => {
  if (type === 'interview_invite') return CalendarClock;
  if (type === 'linkedin_request') return Linkedin;
  if (type === 'tools_completion_request') return Wrench;
  if (type === 'employer_reply') return MessageSquare;
  return FileEdit;
};

export const CandidateMessagesInbox = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  // Draft per message id — a draft must never leak between different invitations.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sendingResponse, setSendingResponse] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchMessages = async () => {
    try {
      // Full history (handled + active), newest first.
      const { data, error } = await supabase
        .from('candidate_messages')
        .select('*')
        .eq('candidate_user_id', user!.id)
        .neq('type', 'interview_response')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (e) {
      logError('CandidateMessagesInbox.fetch', e);
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async (msg: Message, response: 'accepted' | 'declined' | 'reply') => {
    if (!user) return;
    const draft = (drafts[msg.id] || "").trim();
    setSendingResponse(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-interview-response', {
        body: {
          match_result_id: msg.match_result_id,
          response,
          message: response === 'reply' ? draft : undefined,
        },
      });
      if (error) throw error;

      if (data?.saved && data?.email_sent === false) {
        toast.warning(
          t(
            "candidate.inbox.responseSavedNoEmail",
            "Odpowiedź została zapisana, ale nie udało się wysłać powiadomienia e-mail do pracodawcy. Zobaczy ją w panelu.",
          ),
        );
      } else {
        toast.success(t("candidate.inbox.responseSent", "Odpowiedź została wysłana do pracodawcy"));
      }
      setReplyingId(null);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[msg.id];
        return next;
      });
      // Accept/decline resolve the invitation; a plain reply also closes it from the task list.
      await fetchMessages();
    } catch (e) {
      logError('CandidateMessagesInbox.submitResponse', e);
      toast.error(t("errors.genericError"));
    } finally {
      setSendingResponse(false);
    }
  };


  // Persistent "handled" state per user — stored in candidate_messages.read_at (no extra table).
  const markHandled = async (id: string) => {
    const stamp = new Date().toISOString();
    const { error } = await supabase.from('candidate_messages').update({ read_at: stamp }).eq('id', id);
    if (error) {
      logError('CandidateMessagesInbox.markHandled', error);
      toast.error(t("errors.genericError"));
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read_at: stamp } : m)));
  };

  const typeLabelFor = (type: string) =>
    type === 'interview_invite' ? t("candidate.inbox.interviewInvite") :
    type === 'linkedin_request' ? t("candidate.inbox.linkedinRequest") :
    type === 'tools_completion_request' ? t("candidate.inbox.toolsRequest", "Prośba o uzupełnienie narzędzi") :
    type === 'employer_reply' ? t("candidate.inbox.employerReply", "Wiadomość od pracodawcy") :
    t("candidate.inbox.profileCompletion");

  if (loading) return null;

  const active = messages.filter((m) => !m.read_at);
  const handled = messages.filter((m) => !!m.read_at);

  if (active.length === 0 && handled.length === 0) return null;

  const historyDialog = (
    <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("candidate.inbox.history", "Historia wiadomości")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {handled.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t("candidate.inbox.historyEmpty", "Brak obsłużonych wiadomości.")}
            </p>
          ) : (
            handled.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 border rounded-lg p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{typeLabelFor(m.type)}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.metadata?.company_name || m.metadata?.offer_title
                      ? `${m.metadata?.company_name ?? ""}${m.metadata?.company_name && m.metadata?.offer_title ? " — " : ""}${m.metadata?.offer_title ?? ""} · `
                      : ""}
                    {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary">{t("candidate.inbox.handled", "Obsłużone")}</Badge>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  // Everything handled — dashboard stays clean, history remains reachable.
  if (active.length === 0) {
    return (
      <div className="mb-8 flex justify-end">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => setHistoryOpen(true)}>
          <History className="w-4 h-4" />
          {t("candidate.inbox.history", "Historia wiadomości")} ({handled.length})
        </Button>
        {historyDialog}
      </div>
    );
  }

  return (
    <Card className="mb-8 border-accent/30">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-accent" />
          {t("candidate.inbox.title")}
          <Badge className="bg-accent text-accent-foreground">{active.length}</Badge>
        </CardTitle>
        {handled.length > 0 && (
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => setHistoryOpen(true)}>
            <History className="w-4 h-4" />
            {t("candidate.inbox.history", "Historia wiadomości")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {active.map((msg) => {
          const Icon = iconForType(msg.type);
          const typeLabel = typeLabelFor(msg.type);
          const calendarLink = msg.metadata?.calendar_link as string | undefined;
          // Business actions resolve these types; only informational ones get a manual dismiss.
          const dismissible = msg.type === 'employer_reply';
          return (
            <div key={msg.id} className="p-4 rounded-lg border bg-accent/5 border-accent/30">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm">{typeLabel}</span>
                    <Badge variant="outline" className="text-xs">{t("candidate.inbox.new")}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">{msg.content}</p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {msg.type === 'interview_invite' && (
                      <>
                        {replyingId === msg.id ? (
                          <div className="w-full space-y-2">
                            <Textarea
                              placeholder={t("candidate.inbox.replyPlaceholder", "Napisz wiadomość do pracodawcy...")}
                              value={drafts[msg.id] ?? ""}
                              onChange={(e) => setDrafts((prev) => ({ ...prev, [msg.id]: e.target.value }))}
                              rows={3}
                              className="text-sm"
                            />
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={sendingResponse || !(drafts[msg.id] ?? "").trim()}
                                onClick={() => submitResponse(msg, 'reply')}
                              >
                                <MessageSquare className="w-3 h-3 mr-1" />
                                {t("candidate.inbox.sendReply", "Wyślij odpowiedź")}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setReplyingId(null); setDrafts((prev) => ({ ...prev, [msg.id]: "" })); }}>
                                {t("common.cancel", "Anuluj")}
                              </Button>

                            </div>
                          </div>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => submitResponse(msg, 'accepted')} disabled={sendingResponse}>
                              <CheckCircle className="w-3 h-3" />
                              {t("candidate.inbox.acceptInvite", "Potwierdzam udział")}
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => submitResponse(msg, 'declined')} disabled={sendingResponse}>
                              <XCircle className="w-3 h-3" />
                              {t("candidate.inbox.declineInvite", "Odmawiam")}
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => setReplyingId(msg.id)} disabled={sendingResponse}>
                              <MessageSquare className="w-3 h-3" />
                              {t("candidate.inbox.reply", "Odpowiedz")}
                            </Button>
                          </>
                        )}
                      </>
                    )}
                    {calendarLink && (
                      <a href={calendarLink} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1">
                          <ExternalLink className="w-3 h-3" />
                          {t("candidate.inbox.openCalendar")}
                        </Button>
                      </a>
                    )}
                    {msg.type === 'profile_completion' && (
                      <Link to="/candidate/additional#gtk">
                        <Button size="sm" variant="outline">{t("candidate.inbox.openProfile")}</Button>
                      </Link>
                    )}
                    {msg.type === 'linkedin_request' && (
                      <Link to="/candidate/additional#linkedin">
                        <Button size="sm" variant="outline">{t("candidate.inbox.addLinkedin")}</Button>
                      </Link>
                    )}
                    {msg.type === 'tools_completion_request' && (
                      <Link to="/candidate/additional#tools">
                        <Button size="sm" variant="outline" className="gap-1">
                          <Wrench className="w-3 h-3" />
                          {t("candidate.inbox.openTools", "Uzupełnij narzędzia")}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
                {dismissible && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 h-7 w-7"
                    aria-label={t("candidate.inbox.dismiss", "Ukryj")}
                    onClick={() => markHandled(msg.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
      {historyDialog}
    </Card>
  );
};
