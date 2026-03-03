import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logError } from "@/lib/errorLogger";
import { MessageSquare } from "lucide-react";

interface FeedbackModalProps {
  userType: "candidate" | "employer";
  isComplete: boolean;
}

export const FeedbackModal = ({ userType, isComplete }: FeedbackModalProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({
    likesSolution: "",
    likesReason: "",
    wouldChange: "",
    changeReason: "",
  });

  useEffect(() => {
    if (!isComplete || !user) return;
    checkShouldShow();
  }, [isComplete, user]);

  const checkShouldShow = async () => {
    if (!user) return;
    try {
      // Check if feedback already submitted
      const table = userType === "candidate" ? "candidate_feedback" : "employer_feedback";
      const { data: existing } = await supabase.from(table).select("id").eq("user_id", user.id).limit(1);
      if (existing && existing.length > 0) return;

      // Check cooldown
      const { data: profile } = await supabase
        .from("profiles")
        .select("feedback_modal_dismissed_at")
        .eq("user_id", user.id)
        .single();

      if (profile?.feedback_modal_dismissed_at) {
        const dismissed = new Date(profile.feedback_modal_dismissed_at);
        const daysSince = (Date.now() - dismissed.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 14) return;
      }

      // Show with a small delay
      setTimeout(() => setOpen(true), 2000);
    } catch (e) {
      logError("FeedbackModal.checkShouldShow", e);
    }
  };

  const handleDismiss = async () => {
    setOpen(false);
    if (!user) return;
    try {
      await supabase
        .from("profiles")
        .update({ feedback_modal_dismissed_at: new Date().toISOString() })
        .eq("user_id", user.id);
    } catch (e) {
      logError("FeedbackModal.handleDismiss", e);
    }
  };

  const handleSubmit = async () => {
    if (!user || !answers.likesSolution || !answers.wouldChange) return;
    setLoading(true);
    try {
      const table = userType === "candidate" ? "candidate_feedback" : "employer_feedback";
      const { error } = await supabase.from(table).insert({
        user_id: user.id,
        likes_solution: answers.likesSolution,
        likes_reason: answers.likesReason || null,
        would_change: answers.wouldChange,
        change_reason: answers.changeReason || null,
      });
      if (error) throw error;
      toast.success(t("common.thankYou"));
      setOpen(false);
    } catch (e) {
      logError("FeedbackModal.handleSubmit", e);
      toast.error(t("errors.genericError"));
    } finally {
      setLoading(false);
    }
  };

  const feedbackPrefix = userType === "candidate" ? "candidate.feedback" : "employer.feedback";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDismiss(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-accent" />
            {t(`${feedbackPrefix}.title`)}
          </DialogTitle>
          <DialogDescription>{t(`${feedbackPrefix}.subtitle`)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Question 1 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t(`${feedbackPrefix}.likesSolutionQuestion`)}</Label>
            <RadioGroup value={answers.likesSolution} onValueChange={(v) => setAnswers(p => ({ ...p, likesSolution: v }))}>
              {["tak", "nie"].map((val) => (
                <label key={val} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                  <RadioGroupItem value={val} id={`likes-${val}`} />
                  <span>{t(`${feedbackPrefix}.${val === "tak" ? "yes" : "no"}`)}</span>
                </label>
              ))}
            </RadioGroup>
            {answers.likesSolution && (
              <Textarea
                value={answers.likesReason}
                onChange={(e) => setAnswers(p => ({ ...p, likesReason: e.target.value }))}
                placeholder={t(`${feedbackPrefix}.likesReasonPlaceholder`)}
                rows={2}
              />
            )}
          </div>

          {/* Question 2 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t(`${feedbackPrefix}.wouldChangeQuestion`)}</Label>
            <RadioGroup value={answers.wouldChange} onValueChange={(v) => setAnswers(p => ({ ...p, wouldChange: v }))}>
              {["tak", "nie"].map((val) => (
                <label key={val} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                  <RadioGroupItem value={val} id={`change-${val}`} />
                  <span>{t(`${feedbackPrefix}.${val === "tak" ? "yes" : "no"}`)}</span>
                </label>
              ))}
            </RadioGroup>
            {answers.wouldChange === "yes" && (
              <Textarea
                value={answers.changeReason}
                onChange={(e) => setAnswers(p => ({ ...p, changeReason: e.target.value }))}
                placeholder={t(`${feedbackPrefix}.changeReasonPlaceholder`)}
                rows={2}
              />
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={handleDismiss} className="flex-1">
            {t("common.later")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!answers.likesSolution || !answers.wouldChange || loading}
            className="flex-1 bg-cta text-cta-foreground hover:bg-cta/90"
          >
            {loading ? t("common.saving") : t("common.send")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
