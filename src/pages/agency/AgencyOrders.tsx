import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Inbox, Mail, Phone, Search } from "lucide-react";
import { AgencyLayout } from "@/components/agency/AgencyLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePartnerOrders, type PartnerOrder } from "@/hooks/usePartnerData";
import { formatAmount, formatDate } from "@/lib/partnerFormat";

const TABS = ["new", "in_progress", "history"] as const;
type OrderTab = (typeof TABS)[number];

// Page où la demande se traite (no-show hôtel, statut d'une commande).
const MANAGE_PATHS: Record<string, string> = {
  catalog_hotels: "/agency/hotel-bookings",
  catalog_artisans: "/agency/artisans",
};

const orderStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" =>
  status === "cancelled" || status === "no_show"
    ? "destructive"
    : status === "pending"
      ? "outline"
      : status === "confirmed"
        ? "default"
        : "secondary";

export default function AgencyOrders() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: OrderTab = TABS.includes(tabParam as OrderTab) ? (tabParam as OrderTab) : "new";
  const [search, setSearch] = useState("");
  const { data: orders = [], isLoading, isError } = usePartnerOrders();

  const counts = useMemo(
    () => Object.fromEntries(TABS.map((b) => [b, orders.filter((o) => o.bucket === b).length])),
    [orders],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter(
      (o) => o.bucket === tab && (!term || `${o.title} ${o.customer_name ?? ""}`.toLowerCase().includes(term)),
    );
  }, [orders, tab, search]);

  const changeTab = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("ux.partner.orders.title")}</h1>
          <p className="text-muted-foreground">{t("ux.partner.orders.subtitle")}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={tab} onValueChange={changeTab}>
            <TabsList className="h-auto flex-wrap">
              {TABS.map((b) => (
                <TabsTrigger key={b} value={b} className="gap-2">
                  {t(`ux.partner.orders.tabs.${b}`)}
                  <Badge variant={b === "new" && counts[b] > 0 ? "destructive" : "secondary"}>{counts[b]}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("ux.partner.orders.search")}
              className="pl-10"
              aria-label={t("ux.partner.orders.search")}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{t(`ux.partner.orders.help.${tab}`)}</p>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="py-10 text-center text-muted-foreground">{t("ux.partner.loading")}</p>
            ) : isError ? (
              <p className="py-10 text-center text-muted-foreground">{t("ux.partner.loadError")}</p>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                <Inbox className="h-10 w-10" />
                <p>{t(`ux.partner.orders.empty.${tab}`)}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("ux.partner.orders.service")}</TableHead>
                    <TableHead>{t("ux.partner.orders.date")}</TableHead>
                    <TableHead>{t("ux.partner.orders.customer")}</TableHead>
                    <TableHead className="text-right">{t("ux.partner.orders.amount")}</TableHead>
                    <TableHead>{t("ux.partner.orders.status")}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((order) => (
                    <OrderRow key={`${order.order_kind}-${order.order_id}`} order={order} />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AgencyLayout>
  );
}

function OrderRow({ order }: { order: PartnerOrder }) {
  const { t } = useTranslation();
  const manage = MANAGE_PATHS[order.module];
  const contactHidden = !order.customer_phone && !order.customer_email;

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{order.title}</p>
        <p className="text-xs text-muted-foreground">
          {t(`ux.partner.menu.${order.module}`)}
          {order.quantity ? ` · ${t("ux.partner.orders.quantity", { count: order.quantity })}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("ux.partner.orders.received", { date: formatDate(order.created_at, true) })}
        </p>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {order.service_date ? formatDate(order.service_date) : "—"}
        {order.service_time ? ` · ${order.service_time.slice(0, 5)}` : ""}
      </TableCell>
      <TableCell>
        <p>{order.customer_name || "—"}</p>
        {order.customer_phone && (
          <a href={`tel:${order.customer_phone}`} className="flex items-center gap-1 text-xs text-primary">
            <Phone className="h-3 w-3" /> {order.customer_phone}
          </a>
        )}
        {order.customer_email && (
          <a href={`mailto:${order.customer_email}`} className="flex items-center gap-1 text-xs text-primary">
            <Mail className="h-3 w-3" /> {order.customer_email}
          </a>
        )}
        {contactHidden && <p className="text-xs text-muted-foreground">{t("ux.partner.customers.contactHidden")}</p>}
        {order.notes && <p className="mt-1 max-w-xs text-xs italic text-muted-foreground">« {order.notes} »</p>}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right">
        {order.amount != null ? formatAmount(order.amount) : "—"}
      </TableCell>
      <TableCell>
        <Badge variant={orderStatusVariant(order.status)}>{t(`ux.partner.status.${order.status}`)}</Badge>
      </TableCell>
      <TableCell className="text-right">
        {manage && (
          <Button asChild variant="outline" size="sm">
            <Link to={manage}>{t("ux.partner.orders.manage")}</Link>
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
