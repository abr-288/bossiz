import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { LifeBuoy, Mail, MessageCircle, Phone } from "lucide-react";
import { AgencyLayout } from "@/components/agency/AgencyLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSiteConfigContext } from "@/contexts/SiteConfigContext";
import { usePartnerPortal } from "@/hooks/usePartnerPortal";
import { realPhoneNumber, whatsAppLink } from "@/lib/contactNumbers";
import { formatDate } from "@/lib/partnerFormat";
import { HELP_FAQ as HELP_FAQ_FR } from "@/data/helpFaqData";
import { HELP_FAQ_EN } from "@/data/helpFaqData.en";
import { HELP_FAQ_ZH } from "@/data/helpFaqData.zh";

const TOPICS = ["finances", "bookings", "catalog", "account", "technical", "other"] as const;
const SUPPORT_EMAIL = "support@bossiz.com";

export default function AgencySupport() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { config } = useSiteConfigContext();
  const { data: portal } = usePartnerPortal();
  const [topic, setTopic] = useState<string>("finances");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // FAQ « Agences partenaires » du centre d'aide, dans la langue de l'interface.
  const faq = useMemo(() => {
    const lang = i18n.language.startsWith("zh") ? "zh" : i18n.language.startsWith("en") ? "en" : "fr";
    const translated = lang === "zh" ? HELP_FAQ_ZH : lang === "en" ? HELP_FAQ_EN : null;
    return HELP_FAQ_FR.map((entry, i) =>
      translated && translated[i]?.[0] === entry.domain
        ? { ...entry, question: translated[i][1], answer: translated[i][2] }
        : entry,
    ).filter((entry) => entry.domain === "agency");
  }, [i18n.language]);

  const tickets = useQuery({
    queryKey: ["partner-tickets", portal?.agency_id],
    enabled: !!portal?.agency_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_support_tickets")
        .select("id, topic, subject, status, created_at")
        .eq("agency_id", portal!.agency_id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!portal) return;
    setSending(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: ticket, error } = await supabase
      .from("partner_support_tickets")
      .insert({ agency_id: portal.agency_id, topic, subject: subject.trim(), message: message.trim() })
      .select("id")
      .single();
    if (error || !ticket) {
      setSending(false);
      toast.error(t("ux.partner.support.sendError"));
      return;
    }
    // Copie au support par e-mail ; le ticket reste enregistré même si
    // l'envoi échoue.
    const reference = ticket.id.slice(0, 8).toUpperCase();
    const { error: mailError } = await supabase.functions.invoke("send-support-email", {
      body: {
        name: portal.name,
        email: user?.email ?? "",
        bookingReference: `Ticket partenaire ${reference}`,
        subject: `[Partenaire · ${t(`ux.partner.support.topics.${topic}`, { lng: "fr" })}] ${subject.trim()}`,
        message: message.trim(),
      },
    });
    if (mailError) console.error("Partner ticket email error:", mailError);
    setSending(false);
    setSubject("");
    setMessage("");
    toast.success(t("ux.partner.support.sent", { reference }));
    queryClient.invalidateQueries({ queryKey: ["partner-tickets"] });
  };

  const phone = realPhoneNumber(config.contact.phone);
  const whatsapp = whatsAppLink(config.contact.whatsapp);

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("ux.partner.support.title")}</h1>
          <p className="text-muted-foreground">{t("ux.partner.support.subtitle")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5" />
                {t("ux.partner.support.newTicket")}
              </CardTitle>
              <CardDescription>{t("ux.partner.support.newTicketHelp")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket-topic">{t("ux.partner.support.topic")}</Label>
                  <Select value={topic} onValueChange={setTopic}>
                    <SelectTrigger id="ticket-topic">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOPICS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {t(`ux.partner.support.topics.${key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticket-subject">{t("ux.partner.support.subject")}</Label>
                  <Input
                    id="ticket-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    minLength={3}
                    maxLength={150}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticket-message">{t("ux.partner.support.message")}</Label>
                  <Textarea
                    id="ticket-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    minLength={10}
                    maxLength={5000}
                    rows={5}
                    required
                  />
                </div>
                <Button type="submit" disabled={sending || !portal}>
                  {t("ux.partner.support.send")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("ux.partner.support.myTickets")}</CardTitle>
              </CardHeader>
              <CardContent>
                {(tickets.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("ux.partner.support.noTickets")}</p>
                ) : (
                  <ul className="divide-y text-sm">
                    {(tickets.data ?? []).map((ticket) => (
                      <li key={ticket.id} className="flex items-center justify-between gap-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {ticket.id.slice(0, 8).toUpperCase()} · {formatDate(ticket.created_at)} ·{" "}
                            {t(`ux.partner.support.topics.${ticket.topic}`)}
                          </p>
                        </div>
                        <Badge
                          variant={ticket.status === "resolved" || ticket.status === "closed" ? "secondary" : "outline"}
                        >
                          {t(`ux.partner.support.status.${ticket.status}`)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("ux.partner.support.contact")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-2 text-primary">
                  <Mail className="h-4 w-4" /> {SUPPORT_EMAIL}
                </a>
                {phone && (
                  <a href={`tel:${phone}`} className="flex items-center gap-2 text-primary">
                    <Phone className="h-4 w-4" /> {phone}
                  </a>
                )}
                {whatsapp && (
                  <a href={whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("ux.partner.support.faq")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {faq.map((entry, index) => (
                <AccordionItem key={entry.question} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left">{entry.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{entry.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AgencyLayout>
  );
}
