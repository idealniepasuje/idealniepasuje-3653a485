import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Mail, CheckCircle, XCircle, MessageSquare, Phone, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logError } from "@/lib/errorLogger";
import { toast } from "sonner";

interface EmployerMessage {
  id: string;
  match_result_id: string | null;
  candidate_user_id: string;
  employer_user_id: string;
  type: string;
  content: string;
  metadata: any;
  employer_read_at: string | null;
  created_at: string;
}

interface Contact {
  email: string | null;
  phone: string | null;
}

export const EmployerMessagesInbox = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<EmployerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
  // Draft per message id — a draft must never leak between different responses.
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchMessages = async () => {
    try {
      // Full history (read + unread), newest first.
      const { data, error } = await supabase
        .from("candidate_messages")
        .select("*")
        .eq("employer_user_id", user!.id)
        .eq("type", "interview_response")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = (data || []) as unknown as EmployerMessage[];
      setMessages(rows);

      const unique = Array.from(new Set(rows.map((r) => r.candidate_user_id)));
      const entries = await Promise.all(
        unique.map(async (candidateId) => {
          try {
            const { data: c } = await supabase.functions.invoke("get-candidate-contact", {
              body: { candidate_user_id: candidateId },
            });
            return [candidateId, { email: c?.email ?? null, phone: c?.phone ?? null }] as const;
          } catch {
            return [candidateId, { email: null, phone: null }] as const;
          }
        }),
      );
      setContacts(Object.fromEntries(entries));
    } catch (e) {
      logError("EmployerMessagesInbox.fetch", e);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    const stamp = new Date().toISOString();
    const { error } = await supabase
      .from("candidate_messages")
      .update({ employer_read_at: stamp } as any)
      .eq("id", id);
    if (error) {
      logError("EmployerMessagesInbox.markRead", error);
      toast.error(t("errors.genericError"));
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, employer_read_at: stamp } : m)));
  };


  const sendReply = async (msg: EmployerMessage) => {
    const draft = (drafts[msg.id] || "").trim();
    if (!draft || !msg.match_result_id) return;
    // Stable idempotency key per reply attempt (kept across retries of the same draft)
    let requestId = requestIds[msg.id];
    if (!requestId) {
      requestId = crypto.randomUUID();
      setRequestIds((prev) => ({ ...prev, [msg.id]: requestId! }));
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-employer-reply", {
        body: {
          match_result_id: msg.match_result_id,
          message: draft,
          client_request_id: requestId,
          in_reply_to_message_id: msg.id,
        },
      });
      if (error) throw error;

      const partial = data && data.saved === true && data.email_sent === false;
      if (partial) {
        toast.warning(
          t(
            "employer.inbox.replySavedEmailFailed",
            "Wiadomość została zapisana, ale nie udało się wysłać e-maila do kandydata.",
          ),
        );
      } else {
        toast.success(t("employer.inbox.replySent", "Wiadomość została wysłana do kandydata"));
      }

      setReplyingId(null);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[msg.id];
        return next;
      });
      setRequestIds((prev) => {
        const next = { ...prev };
        delete next[msg.id];
        return next;
      });
      await markRead(msg.id);
    } catch (e) {
      logError("EmployerMessagesInbox.sendReply", e);
      toast.error(t("errors.genericError"));
    } finally {
      setSending(false);
    }
  };

  if (loading || messages.length === 0) return null;

  const unreadCount = messages.filter((m) => !m.employer_read_at).length;

  return (
    <Card className="mb-6 border-accent/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-accent" />
          {t("employer.inbox.title", "Odpowiedzi kandydatów")}
          {unreadCount > 0 && <Badge className="bg-accent text-accent-foreground">{unreadCount}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.map((msg) => {
          const response = msg.metadata?.response as string | undefined;
          const accepted = response === "accepted";
          const declined = response === "declined";
          const Icon = accepted ? CheckCircle : declined ? XCircle : MessageSquare;
          const statusLabel = accepted
            ? t("employer.inbox.accepted", "Potwierdził(a) udział w rozmowie")
            : declined
            ? t("employer.inbox.declined", "Odmówił(a) udziału")
            : t("employer.inbox.replied", "Odpowiedział(a) na zaproszenie");
          const contact = contacts[msg.candidate_user_id];

          return (
            <div
              key={msg.id}
              className={`p-4 rounded-lg border ${msg.employer_read_at ? "bg-muted/30" : "bg-accent/5 border-accent/30"}`}
            >

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Icon className={`w-4 h-4 ${declined ? "text-destructive" : "text-accent"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm">{statusLabel}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  {msg.content && (
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">{msg.content}</p>
                  )}

                  {(contact?.email || contact?.phone) && (
                    <div className="flex flex-wrap gap-3 mt-2 text-sm">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1 text-accent hover:underline">
                          <Mail className="w-3 h-3" /> {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1 text-accent hover:underline">
                          <Phone className="w-3 h-3" /> {contact.phone}
                        </a>
                      )}
                    </div>
                  )}

                  {replyingId === msg.id ? (
                    <div className="w-full space-y-2 mt-3">
                      <Textarea
                        placeholder={t("employer.inbox.replyPlaceholder", "Napisz wiadomość do kandydata...")}
                        value={drafts[msg.id] ?? ""}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [msg.id]: e.target.value }))}
                        rows={3}
                        className="text-sm"
                      />
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" disabled={sending || !(drafts[msg.id] ?? "").trim()} onClick={() => sendReply(msg)}>
                          <MessageSquare className="w-3 h-3 mr-1" />
                          {t("employer.inbox.sendReply", "Wyślij wiadomość")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setReplyingId(null); setDrafts((prev) => ({ ...prev, [msg.id]: "" })); }}>
                          {t("common.cancel", "Anuluj")}
                        </Button>

                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {msg.match_result_id && (
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => setReplyingId(msg.id)}>
                          <MessageSquare className="w-3 h-3" />
                          {t("employer.inbox.reply", "Odpowiedz kandydatowi")}
                        </Button>
                      )}
                      <Link
                        to={`/employer/candidate/${msg.candidate_user_id}${msg.match_result_id ? `?matchId=${msg.match_result_id}` : ""}`}
                      >
                        <Button size="sm" variant="outline" className="gap-1">
                          <User className="w-3 h-3" />
                          {t("employer.inbox.openCandidate", "Zobacz profil kandydata")}
                        </Button>
                      </Link>
                      {!msg.employer_read_at && (
                        <Button size="sm" variant="ghost" onClick={() => markRead(msg.id)}>
                          {t("employer.inbox.markAsRead", "Oznacz jako przeczytane")}
                        </Button>
                      )}

                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
