import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Star } from "lucide-react";
import { UserDashboardLayout } from "@/components/dashboard/UserDashboardLayout";
import { WriteReviewDialog } from "@/components/reviews/WriteReviewDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyReviewableItems, type ReviewableItem } from "@/hooks/useReviews";
import { currentLocaleTag } from "@/lib/dateLocale";

const formatDay = (value: string) =>
  new Date(value).toLocaleDateString(currentLocaleTag(), { day: "numeric", month: "long", year: "numeric" });

// Prestations effectuées à noter (lien de l'e-mail d'invitation) et avis
// déjà envoyés.
const MyReviews = () => {
  const { t } = useTranslation();
  const { data: items = [], isLoading, isError } = useMyReviewableItems();
  const [selected, setSelected] = useState<ReviewableItem | null>(null);
  const toReview = items.filter((i) => !i.reviewed);
  const reviewed = items.filter((i) => i.reviewed);

  return (
    <UserDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("ux.reviews.myTitle")}</h1>
          <p className="text-muted-foreground">{t("ux.reviews.mySubtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("ux.reviews.toReview")}</CardTitle>
            <CardDescription>{t("ux.reviews.toReviewHelp")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{t("ux.reviews.loading")}</p>
            ) : isError ? (
              <p className="text-sm text-muted-foreground">{t("ux.reviews.loadError")}</p>
            ) : toReview.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("ux.reviews.nothingToReview")}</p>
            ) : (
              <ul className="divide-y">
                {toReview.map((item) => (
                  <li
                    key={`${item.source_type}-${item.source_id}`}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{formatDay(item.service_at)}</p>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={() => setSelected(item)}>
                      <Star className="h-4 w-4" />
                      {t("ux.reviews.rate")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {reviewed.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("ux.reviews.alreadySent")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {reviewed.map((item) => (
                  <li
                    key={`${item.source_type}-${item.source_id}`}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{formatDay(item.service_at)}</p>
                    </div>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      {t("ux.reviews.sent")}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {selected && (
        <WriteReviewDialog
          open={!!selected}
          onOpenChange={(open) => !open && setSelected(null)}
          sourceType={selected.source_type}
          sourceId={selected.source_id}
          title={selected.title}
          onSubmitted={() => setSelected(null)}
        />
      )}
    </UserDashboardLayout>
  );
};

export default MyReviews;
