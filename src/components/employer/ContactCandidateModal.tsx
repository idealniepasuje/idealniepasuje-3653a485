import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarClock, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logError } from "@/lib/errorLogger";
import { getInterviewInviteTemplate, InterviewType, getContactRequestTemplate } from "@/data/messageTemplates";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: any;
  candidateUserId: string;
  employerUserId: string;
  companyName?: string;
  onUpdated: () => void;
}

export const ContactCandidateModal = ({
  open,
  onOpenChange,
  match,
  candidateUserId,
  employerUserId,
  companyName,
  onUpdated,
}: Props) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [interviewType, setInterviewType] = useState<InterviewType>("online");
  const [calendarLink, setCalendarLink] = useState("");
  const [interviewMsg, setInterviewMsg] = useState("");
  const [sending, setSending] = useState(false);

  const [contact, setContact] = useState<{ email: string | null; phone: string | null } | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);

  useEffect(() => {
    if (!open) return;
    setInterviewMsg(getInterviewInviteTemplate(lang, interviewType, companyName, calendarLink));
    (async () => {
      setLoadingContact(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-candidate-contact', {
          body: { candidate_user_id: candidateUserId },
        });
        if (error) throw error;
        setContact({ email: (data as any)?.email ?? null, phone: (data as any)?.phone ?? null });
      } catch (e) {
        logError('ContactCandidateModal.fetchContact', e);
        setContact({ email: null, phone: null });
      } finally {
        setLoadingContact(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setInterviewMsg(getInterviewInviteTemplate(lang, interviewType, companyName, calendarLink));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewType, calendarLink]);

  const handleSendInterview = async () => {
    if (!interviewMsg.trim()) { toast.error(t("errors.genericError")); return; }
    setSending(true);
    try {
      const { error: insertErr } = await supabase.from('candidate_messages').insert({
        match_result_id: match?.id,
        candidate_user_id: candidateUserId,
        employer_user_id: employerUserId,
        type: 'interview_invite',
        content: interviewMsg,
        metadata: { interview_type: interviewType, calendar_link: calendarLink },
      });
      if (insertErr) throw insertErr;
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
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("employer.candidateDetail.contact.modalTitle")}</DialogTitle>
          <DialogDescription>{t("employer.candidateDetail.contact.modalDescription")}</DialogDescription>
        </DialogHeader>

        {/* Direct contact info */}
        <div className="mt-2 rounded-lg border bg-accent/5 border-accent/20 p-4 space-y-3">
          <div className="text-sm font-semibold">
            {t("employer.candidateDetail.contact.directContactTitle", "Dane kontaktowe kandydata")}
          </div>
          {loadingContact ? (
            <div className="text-sm text-muted-foreground">{t("common.loading")}</div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                {contact?.email ? (
                  <a href={`mailto:${contact.email}`} className="text-accent hover:underline break-all">{contact.email}</a>
                ) : (
                  <span className="text-muted-foreground italic">{t("employer.candidateDetail.contact.noEmail", "Brak adresu e-mail")}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent shrink-0" />
                {contact?.phone ? (
                  <a href={`tel:${contact.phone}`} className="text-accent hover:underline">{contact.phone}</a>
                ) : (
                  <span className="text-muted-foreground italic">{t("employer.candidateDetail.contact.noPhone", "Kandydat nie podał numeru telefonu")}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Interview invite */}
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 font-semibold">
            <CalendarClock className="w-4 h-4 text-accent" />
            {t("employer.candidateDetail.contact.inviteTab")}
          </div>
          <div className="space-y-2">
            <Label>{t("employer.candidateDetail.contact.interviewTypeLabel")}</Label>
            <RadioGroup value={interviewType} onValueChange={(v) => setInterviewType(v as InterviewType)} className="flex gap-4 flex-wrap">
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
          <Button onClick={handleSendInterview} disabled={sending} className="w-full bg-cta text-cta-foreground hover:bg-cta/90">
            {sending ? t("common.saving") : t("employer.candidateDetail.contact.sendInvite")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
