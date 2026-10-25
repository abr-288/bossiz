import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Phone, Search, ShieldCheck } from "lucide-react";
import { AgencyLayout } from "@/components/agency/AgencyLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePartnerCustomers } from "@/hooks/usePartnerData";
import { formatDate } from "@/lib/partnerFormat";

// Uniquement les clients ayant réservé chez ce partenaire, avec le strict
// nécessaire à la prestation (agency_customers, conformité ARTCI).
export default function AgencyCustomers() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const { data: customers = [], isLoading, isError } = usePartnerCustomers();

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? customers.filter((c) => c.customer_name?.toLowerCase().includes(term)) : customers;
  }, [customers, search]);

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("ux.partner.customers.title")}</h1>
          <p className="text-muted-foreground">{t("ux.partner.customers.subtitle")}</p>
        </div>

        <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>{t("ux.partner.customers.privacy")}</p>
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("ux.partner.customers.search")}
            aria-label={t("ux.partner.customers.search")}
            className="pl-10"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("ux.partner.customers.name")}</TableHead>
                  <TableHead className="text-right">{t("ux.partner.customers.orders")}</TableHead>
                  <TableHead>{t("ux.partner.customers.last")}</TableHead>
                  <TableHead>{t("ux.partner.customers.next")}</TableHead>
                  <TableHead>{t("ux.partner.customers.contact")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || isError || visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      {isLoading
                        ? t("ux.partner.loading")
                        : isError
                          ? t("ux.partner.loadError")
                          : t("ux.partner.customers.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map((c, index) => (
                    <TableRow key={`${c.customer_name}-${c.first_order_at}-${index}`}>
                      <TableCell className="font-medium">{c.customer_name || "—"}</TableCell>
                      <TableCell className="text-right">{c.orders_count}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(c.last_order_at)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(c.next_service_date)}</TableCell>
                      <TableCell>
                        {c.customer_phone || c.customer_email ? (
                          <div className="space-y-0.5 text-xs">
                            {c.customer_phone && (
                              <a href={`tel:${c.customer_phone}`} className="flex items-center gap-1 text-primary">
                                <Phone className="h-3 w-3" /> {c.customer_phone}
                              </a>
                            )}
                            {c.customer_email && (
                              <a href={`mailto:${c.customer_email}`} className="flex items-center gap-1 text-primary">
                                <Mail className="h-3 w-3" /> {c.customer_email}
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("ux.partner.customers.contactHidden")}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AgencyLayout>
  );
}
