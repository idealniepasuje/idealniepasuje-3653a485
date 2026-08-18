import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Linkedin, CalendarClock, FileEdit, ExternalLink, Wrench, CheckCircle, XCircle, MessageSquare } from "lucide-react";
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
  const [replyText, setReplyText] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('candidate_messages')
        .select('*')
        .eq('candidate_user_id', user!.id)
        .neq('type', 'interview_response')
        .is('read_at', null)
        .order('created_at', { ascending: false });
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
    setSendingResponse(true);
    try {
      const { error } = await supabase.functions.invoke('send-interview-response', {
        body: {
          match_result_id: msg.match_result_id,
          response,
          message: response === 'reply' ? replyText.trim() : undefined,
        },
      });
      if (error) throw error;

      toast.success(t("candidate.inbox.responseSent", "Odpowiedź została wysłana do pracodawcy"));
      setReplyingId(null);
      setReplyText("");
      await fetchMessages();
    } catch (e) {
      logError('CandidateMessagesInbox.submitResponse', e);
      toast.error(t("errors.genericError"));
    } finally {
      setSendingResponse(false);
    }
  };

  const markRead = async (id: string) => {
    await supabase.from('candidate_messages').update({ read_at: new Date().toISOString() }).eq('id', id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  if (loading || messages.length === 0) return null;

  return (
    <Card className="mb-8 border-accent/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-accent" />
          {t("candidate.inbox.title")}
          {messages.some((m) => !m.read_at) && (
            <Badge className="bg-accent text-accent-foreground">{messages.filter((m) => !m.read_at).length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.map((msg) => {
          const Icon = iconForType(msg.type);
          const typeLabel =
            msg.type === 'interview_invite' ? t("candidate.inbox.interviewInvite") :
            msg.type === 'linkedin_request' ? t("candidate.inbox.linkedinRequest") :
            msg.type === 'tools_completion_request' ? t("candidate.inbox.toolsRequest", "Prośba o uzupełnienie narzędzi") :
            msg.type === 'employer_reply' ? t("candidate.inbox.employerReply", "Wiadomość od pracodawcy") :
            t("candidate.inbox.profileCompletion");
          const calendarLink = msg.metadata?.calendar_link as string | undefined;
          return (
            <div key={msg.id} className={`p-4 rounded-lg border ${msg.read_at ? 'bg-muted/30' : 'bg-accent/5 border-accent/30'}`}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm">{typeLabel}</span>
                    {!msg.read_at && <Badge variant="outline" className="text-xs">{t("candidate.inbox.new")}</Badge>}
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
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              rows={3}
                              className="text-sm"
                            />
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={sendingResponse || !replyText.trim()}
                                onClick={() => submitResponse(msg, 'reply')}
                              >
                                <MessageSquare className="w-3 h-3 mr-1" />
                                {t("candidate.inbox.sendReply", "Wyślij odpowiedź")}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setReplyingId(null); setReplyText(""); }}>
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
                    {!msg.read_at && (
                      <Button size="sm" variant="ghost" onClick={() => markRead(msg.id)}>
                        {t("candidate.inbox.markAsRead")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
