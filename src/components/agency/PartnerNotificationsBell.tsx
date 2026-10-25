import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePartnerOrders } from "@/hooks/usePartnerData";
import { formatDate } from "@/lib/partnerFormat";

// Notifications de l'en-tête (et non du menu) : les nouvelles demandes à
// traiter, toutes activités de la catégorie confondues.
export function PartnerNotificationsBell() {
  const { t } = useTranslation();
  const { data: orders = [] } = usePartnerOrders();
  const fresh = orders.filter((o) => o.bucket === "new");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={t("ux.partner.bell.label", { count: fresh.length })}
        >
          <Bell className="h-5 w-5" />
          {fresh.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold text-destructive-foreground">
              {fresh.length > 99 ? "99+" : fresh.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="font-semibold">{t("ux.partner.bell.title")}</p>
        </div>
        {fresh.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t("ux.partner.bell.empty")}</p>
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto">
            {fresh.slice(0, 8).map((order) => (
              <li key={`${order.order_kind}-${order.order_id}`}>
                <Link to="/agency/orders?tab=new" className="block px-4 py-3 text-sm hover:bg-muted">
                  <p className="font-medium">{order.title}</p>
                  <p className="text-muted-foreground">
                    {order.customer_name || t("ux.partner.orders.customer")} ·{" "}
                    {formatDate(order.service_date ?? order.created_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t p-2">
          <Button asChild variant="ghost" className="w-full">
            <Link to="/agency/orders?tab=new">{t("ux.partner.bell.seeAll")}</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
