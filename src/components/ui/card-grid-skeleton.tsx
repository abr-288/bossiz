import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CardGridSkeletonProps {
  count?: number;
  /** Classes de grille (colonnes) ; par défaut 1 / 2 / 3 colonnes. */
  gridClassName?: string;
  /** Hauteur de l'image de chaque carte. */
  imageClassName?: string;
  className?: string;
}

// Squelette de grille de cartes : montre la forme du contenu à venir au lieu
// d'un spinner seul, ce qui évite le saut de mise en page à l'affichage.
export function CardGridSkeleton({
  count = 6,
  gridClassName = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  imageClassName = "h-44",
  className,
}: CardGridSkeletonProps) {
  const { t } = useTranslation();
  return (
    <div role="status" aria-live="polite" className={cn("grid gap-6", gridClassName, className)}>
      <span className="sr-only">{t("common.loading")}</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card" aria-hidden="true">
          <Skeleton className={cn("w-full rounded-none", imageClassName)} />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
