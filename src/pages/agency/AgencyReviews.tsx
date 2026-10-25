import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MessageSquareReply, Star } from "lucide-react";
import { AgencyLayout } from "@/components/agency/AgencyLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerReviews, type PartnerReview } from "@/hooks/usePartnerData";
import { formatDate } from "@/lib/partnerFormat";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground/40"}`} />
      ))}
    </span>
  );
}

export default function AgencyReviews() {
  const { t } = useTranslation();
  const { data: reviews = [], isLoading, isError } = usePartnerReviews();
  const published = reviews.filter((r) => r.status === "approved");
  const average = published.length ? published.reduce((sum, r) => sum + r.rating, 0) / published.length : null;

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("ux.partner.reviews.title")}</h1>
          <p className="text-muted-foreground">{t("ux.partner.reviews.subtitle")}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{t("ux.partner.reviews.average")}</p>
              <p className="mt-1 text-2xl font-bold">{average === null ? "—" : `${average.toFixed(1)} / 5`}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{t("ux.partner.reviews.published")}</p>
              <p className="mt-1 text-2xl font-bold">{published.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{t("ux.partner.reviews.unanswered")}</p>
              <p className="mt-1 text-2xl font-bold">{published.filter((r) => !r.partner_reply).length}</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">{t("ux.partner.loading")}</p>
        ) : isError ? (
          <p className="text-muted-foreground">{t("ux.partner.loadError")}</p>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t("ux.partner.reviews.empty")}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewCard key={review.review_id} review={review} />
            ))}
          </div>
        )}
      </div>
    </AgencyLayout>
  );
}

function ReviewCard({ review }: { review: PartnerReview }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [reply, setReply] = useState(review.partner_reply ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.rpc("agency_reply_review", { p_review_id: review.review_id, p_reply: reply });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("ux.partner.reviews.saved"));
    setEditing(false);
    queryClient.invalidateQueries({ queryKey: ["partner-reviews"] });
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Stars rating={review.rating} />
            <span className="font-medium">{review.reviewer_name}</span>
            {review.status === "pending" && <Badge variant="outline">{t("ux.partner.reviews.moderation")}</Badge>}
          </div>
          <span className="text-sm text-muted-foreground">
            {review.service_name} · {formatDate(review.created_at)}
          </span>
        </div>
        {review.comment && <p className="text-sm">{review.comment}</p>}

        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              maxLength={2000}
              rows={3}
              aria-label={t("ux.partner.reviews.yourReply")}
              placeholder={t("ux.partner.reviews.replyPlaceholder")}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                {t("ux.bo.cancel")}
              </Button>
              <Button onClick={save} disabled={saving}>
                {t("ux.partner.reviews.publishReply")}
              </Button>
            </div>
          </div>
        ) : review.partner_reply ? (
          <div className="rounded-md border-l-4 border-primary bg-muted/40 p-3 text-sm">
            <p className="mb-1 font-medium">{t("ux.partner.reviews.yourReply")}</p>
            <p>{review.partner_reply}</p>
            <Button variant="link" className="h-auto p-0 text-xs" onClick={() => setEditing(true)}>
              {t("ux.partner.reviews.editReply")}
            </Button>
          </div>
        ) : review.status === "approved" ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <MessageSquareReply className="mr-2 h-4 w-4" />
            {t("ux.partner.reviews.reply")}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
