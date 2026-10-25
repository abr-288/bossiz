import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitReview, useRefreshReviewableItems } from "@/hooks/useReviews";

interface WriteReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Prestation notée (voir my_reviewable_items) : le serveur vérifie qu'elle
  // a bien eu lieu et qu'elle appartient au client.
  sourceType: string;
  sourceId: string;
  title: string;
  onSubmitted?: () => void;
}

export const WriteReviewDialog = ({
  open,
  onOpenChange,
  sourceType,
  sourceId,
  title,
  onSubmitted,
}: WriteReviewDialogProps) => {
  const { t } = useTranslation();
  const refreshReviewable = useRefreshReviewableItems();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setRating(0);
    setHoverRating(0);
    setComment("");
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(t("ux.reviews.pickRating"));
      return;
    }

    setSubmitting(true);
    const { error } = await submitReview(sourceType, sourceId, rating, comment);
    setSubmitting(false);

    if (error) {
      toast.error(
        error.code === "23505"
          ? t("ux.reviews.alreadyReviewed")
          : error.code === "42501"
            ? t("ux.reviews.notYet")
            : t("ux.reviews.sendError"),
      );
      return;
    }

    toast.success(t("ux.reviews.thanks"));
    reset();
    onOpenChange(false);
    refreshReviewable();
    onSubmitted?.();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("ux.reviews.write")}</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center gap-1" role="radiogroup" aria-label={t("ux.reviews.yourRating")}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={rating === star}
                className="p-1"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={t("ux.reviews.stars", { count: star })}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoverRating || rating) ? "fill-gold text-gold" : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>

          <Textarea
            placeholder={t("ux.reviews.commentPlaceholder")}
            aria-label={t("ux.reviews.commentPlaceholder")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground">{t("ux.reviews.moderationNotice")}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("ux.reviews.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="gradient-primary">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("ux.reviews.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
