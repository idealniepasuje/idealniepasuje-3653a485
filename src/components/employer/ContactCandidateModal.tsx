import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarClock, Linkedin, Sparkles, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logError } from "@/lib/errorLogger";
import {
  getInterviewInviteTemplate,
  getLinkedinRequestTemplate,
  getProfileCompletionTemplate,
  InterviewType,
} from "@/data/messageTemplates";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: any;
  candidateUserId: string;
  employerUserId: string;
  companyName?: string;
  candidateLinkedinUrl?: string | null;
  candidateGettingToKnow?: Record<string, string> | null;
  onUpdated: () => void;
}

export const ContactCandidateModal = ({
  open,
  onOpenChange,
  match,
  candidateUserId,
  employerUserId,
  companyName,
  candidateLinkedinUrl,
  candidateGettingToKnow,
  onUpdated,
}: Props) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [interviewType, setInterviewType] = useState<InterviewType>("online");
  const [calendarLink, setCalendarLink] = useState("");
  const [interviewMsg, setInterviewMsg] = useState("");
  const [linkedinMsg, setLinkedinMsg] = useState("");
  const [completionMsg, setCompletionMsg] = useState("");
  const [sending, setSending] = useState<string | null>(null);

  const gtk = candidateGettingToKnow || {};
  const gettingToKnowReady = !!(gtk.tasks && gtk.problems && gtk.motivation && gtk.proud_of);
  const hasLinkedin = !!(candidateLinkedinUrl && candidateLinkedinUrl.trim());

  useEffect(() => {
    if (open) {
      setInterviewMsg(getInterviewInviteTemplate(lang, interviewType, companyName, calendarLink));
      setLinkedinMsg(getLinkedinRequestTemplate(lang, companyName));
      setCompletionMsg(getProfileCompletionTemplate(lang, companyName));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setInterviewMsg(getInterviewInviteTemplate(lang, interviewType, companyName, calendarLink));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewType, calendarLink]);

  const insertMessage = async (type: 'linkedin_request' | 'profile_completion' | 'interview_invite', content: string, metadata: Record<string, any> = {}) => {
    const { error } = await supabase.from('candidate_messages').insert({
      match_result_id: match?.id,
      candidate_user_id: candidateUserId,
      employer_user_id: employerUserId,
      type,
      content,
      metadata,
    });
    if (error) throw error;
  };

  const handleSendInterview = async () => {
    if (!interviewMsg.trim()) { toast.error(t("errors.genericError")); return; }
    setSending('interview');
    try {
      await insertMessage('interview_invite', interviewMsg, { interview_type: interviewType, calendar_link: calendarLink });
      await supabase.from('match_results').update({
        interview_invited_at: new Date().toISOString(),
        interview_type: interviewType,
        interview_calendar_link: calendarLink || null,
        interview_message: interviewMsg,
      }).eq('id', match.id);
      toast.success(t("employer.candidateDetail.contact.inviteSent"));
      onUpdated();
      onOpenChange(false);
    } catch (e) {
      logError('ContactCandidateModal.interview', e);
      toast.error(t("errors.genericError"));
    } finally {
      setSending(null);
    }
  };

  const handleSendLinkedin = async () => {
    if (!linkedinMsg.trim()) return;
    setSending('linkedin');
    try {
      await insertMessage('linkedin_request', linkedinMsg);
      await supabase.from('match_results').update({ linkedin_requested_at: new Date().toISOString() }).eq('id', match.id);
      toast.success(t("employer.candidateDetail.contact.linkedinRequestSent"));
      onUpdated();
      onOpenChange(false);
    } catch (e) {
      logError('ContactCandidateModal.linkedin', e);
      toast.error(t("errors.genericError"));
    } finally {
      setSending(null);
    }
  };

  const handleRequestCompletion = async () => {
    setSending('completion');
    try {
      await insertMessage('profile_completion', completionMsg);
      await supabase.from('match_results').update({ profile_completion_requested_at: new Date().toISOString() }).eq('id', match.id);
      try {
        await supabase.functions.invoke('send-profile-completion-request', {
          body: {
            candidate_user_id: candidateUserId,
            employer_company_name: companyName,
            message: completionMsg,
          },
        });
      } catch (mailErr) {
        logError('ContactCandidateModal.completion.email', mailErr);
      }
      toast.success(t("employer.candidateDetail.contact.completionRequested"));
      onUpdated();
      onOpenChange(false);
    } catch (e) {
      logError('ContactCandidateModal.completion', e);
      toast.error(t("errors.genericError"));
    } finally {
      setSending(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("employer.candidateDetail.contact.modalTitle")}</DialogTitle>
          <DialogDescription>{t("employer.candidateDetail.contact.modalDescription")}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="invite" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="invite" className="gap-2"><CalendarClock className="w-4 h-4" />{t("employer.candidateDetail.contact.inviteTab")}</TabsTrigger>
            <TabsTrigger value="linkedin" className="gap-2"><Linkedin className="w-4 h-4" />{t("employer.candidateDetail.contact.linkedinTab")}</TabsTrigger>
            <TabsTrigger value="gtk" className="gap-2"><Sparkles className="w-4 h-4" />{t("employer.candidateDetail.contact.gettingToKnowTab")}</TabsTrigger>
          </TabsList>

          {/* Interview invite */}
          <TabsContent value="invite" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t("employer.candidateDetail.contact.interviewTypeLabel")}</Label>
              <RadioGroup value={interviewType} onValueChange={(v) => setInterviewType(v as InterviewType)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="online" id="t-online" /><Label htmlFor="t-online" className="cursor-pointer">{t("employer.candidateDetail.contact.interviewTypeOnline")}</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="phone" id="t-phone" /><Label htmlFor="t-phone" className="cursor-pointer">{t("employer.candidateDetail.contact.interviewTypePhone")}</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="onsite" id="t-onsite" /><Label htmlFor="t-onsite" className="cursor-pointer">{t("employer.candidateDetail.contact.interviewTypeOnsite")}</Label></div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>{t("employer.candidateDetail.contact.calendarLinkLabel")}</Label>
              <Input type="url" placeholder={t("employer.candidateDetail.contact.calendarLinkPlaceholder")} value={calendarLink} onChange={(e) => setCalendarLink(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("employer.candidateDetail.contact.messageLabel")}</Label>
              <Textarea rows={8} value={interviewMsg} onChange={(e) => setInterviewMsg(e.target.value)} />
            </div>
            <Button onClick={handleSendInterview} disabled={sending !== null} className="w-full bg-cta text-cta-foreground hover:bg-cta/90">
              {sending === 'interview' ? t("common.saving") : t("employer.candidateDetail.contact.sendInvite")}
            </Button>
          </TabsContent>

          {/* LinkedIn — show value or request */}
          <TabsContent value="linkedin" className="space-y-4 mt-4">
            {hasLinkedin ? (
              <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <Linkedin className="w-5 h-5 text-accent" />
                  {t("employer.candidateDetail.contact.linkedinProvidedTitle")}
                </div>
                <a
                  href={candidateLinkedinUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline break-all text-sm flex items-center gap-2"
                >
                  {candidateLinkedinUrl}
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
                <Button asChild variant="outline" className="w-full">
                  <a href={candidateLinkedinUrl!} target="_blank" rel="noopener noreferrer">
                    {t("employer.candidateDetail.contact.linkedinOpen")}
                  </a>
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>{t("employer.candidateDetail.contact.messageLabel")}</Label>
                  <Textarea rows={8} value={linkedinMsg} onChange={(e) => setLinkedinMsg(e.target.value)} />
                </div>
                <Button onClick={handleSendLinkedin} disabled={sending !== null} className="w-full bg-cta text-cta-foreground hover:bg-cta/90">
                  {sending === 'linkedin' ? t("common.saving") : t("employer.candidateDetail.contact.sendLinkedinRequest")}
                </Button>
              </>
            )}
          </TabsContent>

          {/* Getting to know — show answers or request */}
          <TabsContent value="gtk" className="space-y-4 mt-4">
            {gettingToKnowReady ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-medium">
                  <Sparkles className="w-5 h-5 text-accent" />
                  {t("employer.candidateDetail.contact.gettingToKnowReadyTitle")}
                </div>
                <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 text-sm text-muted-foreground">
                  {t("employer.candidateDetail.contact.gettingToKnowReadyHint")}
                </div>
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="text-xs font-medium text-muted-foreground mb-1">{t("candidate.additional.gettingToKnow.q1Label")}</p>
                    <p className="whitespace-pre-wrap">{gtk.tasks}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-xs font-medium text-muted-foreground mb-1">{t("candidate.additional.gettingToKnow.q2Label")}</p>
                    <p className="whitespace-pre-wrap">{gtk.problems}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-xs font-medium text-muted-foreground mb-1">{t("candidate.additional.gettingToKnow.q3Label")}</p>
                    <p className="whitespace-pre-wrap">{gtk.motivation}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-xs font-medium text-muted-foreground mb-1">{t("candidate.additional.gettingToKnow.q4Label")}</p>
                    <p className="whitespace-pre-wrap">{gtk.proud_of}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-lg bg-warning/5 border border-warning/30">
                  <p className="font-medium mb-1">{t("employer.candidateDetail.contact.gettingToKnowMissingTitle")}</p>
                  <p className="text-sm text-muted-foreground">{t("employer.candidateDetail.contact.gettingToKnowMissingDesc")}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t("employer.candidateDetail.contact.messageLabel")}</Label>
                  <Textarea rows={6} value={completionMsg} onChange={(e) => setCompletionMsg(e.target.value)} />
                </div>
                <Button onClick={handleRequestCompletion} disabled={sending !== null} className="w-full bg-cta text-cta-foreground hover:bg-cta/90">
                  {sending === 'completion' ? t("common.saving") : t("employer.candidateDetail.contact.requestCompletion")}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
