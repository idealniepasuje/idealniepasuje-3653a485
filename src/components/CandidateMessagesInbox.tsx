import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Linkedin, CalendarClock, FileEdit, ExternalLink, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logError } from "@/lib/errorLogger";

interface Message {
  id: string;
  type: 'linkedin_request' | 'profile_completion' | 'interview_invite' | 'tools_completion_request';
  content: string;
  metadata: any;
  read_at: string | null;
  created_at: string;
}

const iconForType = (type: string) => {
  if (type === 'interview_invite') return CalendarClock;
  if (type === 'linkedin_request') return Linkedin;
  if (type === 'tools_completion_request') return Wrench;
  return FileEdit;
};

export const CandidateMessagesInbox = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('candidate_messages')
          .select('*')
          .eq('candidate_user_id', user.id)
          .is('read_at', null)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setMessages((data || []) as Message[]);
      } catch (e) {
        logError('CandidateMessagesInbox.fetch', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

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
                    {calendarLink && (
                      <a href={calendarLink} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1">
                          <ExternalLink className="w-3 h-3" />
                          {t("candidate.inbox.openCalendar")}
                        </Button>
                      </a>
                    )}
                    {msg.type === 'profile_completion' && (
                      <Link to="/candidate/additional">
                        <Button size="sm" variant="outline">{t("candidate.inbox.openProfile")}</Button>
                      </Link>
                    )}
                    {msg.type === 'linkedin_request' && (
                      <Link to="/candidate/additional">
                        <Button size="sm" variant="outline">{t("candidate.inbox.addLinkedin")}</Button>
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
