import { motion } from "framer-motion";
import { MapPin, RefreshCw, AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { CardGridSkeleton } from "@/components/ui/card-grid-skeleton";
import { Button } from "@/components/ui/button";
import { DestinationCard } from "./DestinationCard";
import { Destination } from "@/hooks/useDestinations";
import { useTranslation } from "react-i18next";
import { MOTION } from "@/lib/motion";

interface DestinationGridProps {
  destinations: Destination[];
  isLoading: boolean;
  isError?: boolean;
  onRefresh?: () => void;
  variant?: "default" | "featured";
  emptyMessage?: string;
}

export const DestinationGrid = ({
  destinations,
  isLoading,
  isError,
  onRefresh,
  variant = "default",
  emptyMessage,
}: DestinationGridProps) => {
  const { t } = useTranslation();
  if (isLoading) {
    return <CardGridSkeleton count={variant === "featured" ? 3 : 8} gridClassName={variant === "featured" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"} />;
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title={t("ux.destGrid.loadError")}
        description={t("ux.destGrid.loadErrorDesc")}
        action={
          onRefresh && (
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw />
              {t("ux.destGrid.retry")}
            </Button>
          )
        }
      />
    );
  }

  if (!destinations || destinations.length === 0) {
    return <EmptyState icon={MapPin} title={emptyMessage ?? t("ux.destGrid.empty")} description={t("ux.misc.tryAnother")} />;
  }

  const gridClass = variant === "featured"
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: MOTION.slow }}
      className={gridClass}
    >
      {destinations.map((destination, index) => (
        <DestinationCard
          key={destination.id}
          destination={destination}
          index={index}
          variant={variant === "featured" ? "featured" : "default"}
        />
      ))}
    </motion.div>
  );
};
