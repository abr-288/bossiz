import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { usePublicReviews, type ReviewTargetType } from "@/hooks/useReviews";
import { currentLocaleTag } from "@/lib/dateLocale";
import { cn } from "@/lib/utils";

export function StarRow({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("flex", className)} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("h-4 w-4", n <= Math.round(rating) ? "fill-gold text-gold" : "text-muted-foreground/40")}
        />
      ))}
    </span>
  );
}

// Avis publiés d'une fiche, avec la réponse du partenaire.
export function ServiceReviews({
  targetType,
  targetId,
  className,
}: {
  targetType: ReviewTargetType;
  targetId: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = usePublicReviews(targetType, targetId);

  if (isLoading) return <p className="text-sm text-muted-foreground">{t("ux.reviews.loading")}</p>;
  if (isError || !data) return null;
  const { reviews, summary } = data;

  return (
    <section className={cn("space-y-4", className)} aria-label={t("ux.reviews.title")}>
      {summary.count === 0 ? (
        <p className="text-sm text-muted-foreground">{t("ux.reviews.none")}</p>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="text-center sm:w-32">
            <p className="text-4xl font-bold">{summary.average.toFixed(1)}</p>
            <StarRow rating={summary.average} className="justify-center" />
            <p className="mt-1 text-xs text-muted-foreground">{t("ux.reviews.count", { count: summary.count })}</p>
          </div>
          <div className="flex-1 space-y-1">
            {([5, 4, 3, 2, 1] as const).map((n) => (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="w-3">{n}</span>
                <Star className="h-3 w-3 fill-gold text-gold" aria-hidden="true" />
                <Progress
                  value={(summary.distribution[n] / summary.count) * 100}
                  className="h-2 flex-1"
                  aria-label={t("ux.reviews.stars", { count: n })}
                />
                <span className="w-6 text-right text-muted-foreground">{summary.distribution[n]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {reviews.map((review) => (
          <li key={review.review_id} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <StarRow rating={review.rating} />
                <span className="text-sm font-medium">{review.reviewer_name}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString(currentLocaleTag(), {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            {review.comment && <p className="mt-2 text-sm">{review.comment}</p>}
            {review.partner_reply && (
              <div className="mt-3 rounded-md border-l-4 border-primary bg-muted/40 p-2 text-sm">
                <p className="text-xs font-medium">{t("ux.reviews.partnerReply")}</p>
                <p>{review.partner_reply}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// Note d'une fiche (cartes des catalogues) : ouvre la liste des avis. Rien
// n'est affiché tant que la fiche n'a pas d'avis publié.
export function RatingBadge({
  targetType,
  targetId,
  rating,
  count,
  name,
  className,
}: {
  targetType: ReviewTargetType;
  targetId: string;
  rating: number | null | undefined;
  count: number | null | undefined;
  name: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (!count || !rating) return null;

  return (
    <>
      <Button
        type="button"
        variant="link"
        className={cn("h-auto gap-1 p-0 text-sm text-foreground", className)}
        onClick={(event) => {
          // Les cartes sont souvent cliquables : ne pas ouvrir la réservation.
          event.stopPropagation();
          setOpen(true);
        }}
        aria-label={t("ux.reviews.seeReviews", { name })}
      >
        <Star className="h-4 w-4 fill-gold text-gold" aria-hidden="true" />
        <span className="font-semibold">{Number(rating).toFixed(1)}</span>
        <span className="text-muted-foreground">({t("ux.reviews.count", { count })})</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{t("ux.reviews.title")}</DialogTitle>
            <DialogDescription>{name}</DialogDescription>
          </DialogHeader>
          {open && <ServiceReviews targetType={targetType} targetId={targetId} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
