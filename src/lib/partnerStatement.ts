// Relevé mensuel du partenaire, au format HTML imprimable : comme les
// billets et factures (useBookingPDF), le navigateur l'enregistre en PDF
// depuis la boîte d'impression.
import type { FinanceTransaction, FinanceSummary } from "@/hooks/usePartnerData";

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
const pct = (n: number) => `${Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const day = (iso: string) => new Date(iso).toLocaleDateString("fr-FR");

const STATUS_FR: Record<string, string> = {
  pending: "À verser",
  paid: "Réglé",
  cancelled: "Annulé",
  to_invoice: "À facturer",
  issued: "Facturé",
};

export interface StatementInput {
  partnerName: string;
  periodLabel: string;
  summary: FinanceSummary;
  transactions: FinanceTransaction[];
  generatedAt?: Date;
}

export function buildStatementHtml({
  partnerName,
  periodLabel,
  summary,
  transactions,
  generatedAt = new Date(),
}: StatementInput): string {
  const rows = transactions
    .map(
      (tx) => `
      <tr class="${tx.status === "cancelled" ? "cancelled" : ""}">
        <td>${escapeHtml(day(tx.transaction_date))}</td>
        <td>${escapeHtml(tx.reference)}</td>
        <td>${escapeHtml(tx.label)}<br/><small>${tx.collection === "on_site" ? "Payé sur place" : "Payé en ligne"}</small></td>
        <td class="num">${fcfa(tx.gross_amount)}</td>
        <td class="num">${pct(tx.commission_rate)}</td>
        <td class="num">${fcfa(tx.commission_amount)}</td>
        <td class="num"><strong>${fcfa(tx.net_amount)}</strong></td>
        <td>${escapeHtml(STATUS_FR[tx.status] ?? tx.status)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Relevé ${escapeHtml(partnerName)} - ${escapeHtml(periodLabel)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 32px; font-size: 12px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .muted { color: #6b7280; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 16px; }
  .totals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
  .totals div { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; }
  .totals strong { display: block; font-size: 15px; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border-bottom: 1px solid #e5e7eb; padding: 6px 4px; text-align: left; vertical-align: top; }
  th { background: #f3f4f6; font-size: 11px; }
  .num { text-align: right; white-space: nowrap; }
  tr.cancelled td { color: #9ca3af; text-decoration: line-through; }
  small { color: #6b7280; }
  .note { margin-top: 16px; font-size: 11px; color: #4b5563; }
  @media print { body { margin: 12mm; } }
</style>
</head>
<body>
  <div class="head">
    <div>
      <h1>Relevé de compte partenaire</h1>
      <div>${escapeHtml(partnerName)}</div>
      <div class="muted">Période : ${escapeHtml(periodLabel)}</div>
    </div>
    <div style="text-align:right">
      <strong>Bossiz+</strong><br/>
      <span class="muted">Édité le ${escapeHtml(generatedAt.toLocaleDateString("fr-FR"))}</span>
    </div>
  </div>
  <div class="totals">
    <div>Montant brut<strong>${fcfa(summary.gross)}</strong></div>
    <div>Commissions Bossiz<strong>${fcfa(summary.commission)}</strong></div>
    <div>Net partenaire<strong>${fcfa(summary.net)}</strong></div>
    <div>Déjà versé<strong>${fcfa(summary.paid_out)}</strong></div>
    <div>En attente de versement<strong>${fcfa(summary.pending_payout)}</strong></div>
    <div>Commissions à régler (paiements sur place)<strong>${fcfa(summary.due_to_bossiz)}</strong></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th><th>Réf.</th><th>Prestation</th><th class="num">Brut</th><th class="num">Taux</th>
        <th class="num">Commission</th><th class="num">Net partenaire</th><th>Statut</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="8" class="muted">Aucune transaction sur la période.</td></tr>'}</tbody>
  </table>
  <p class="note">
    Commission = montant brut × taux du contrat en vigueur à la date de la transaction. Net partenaire = montant brut − commission.
    Paiement en ligne : Bossiz encaisse et reverse le net. Paiement sur place : le partenaire encaisse et Bossiz facture la commission.
    Les transactions annulées ne sont pas comptées dans les totaux.
  </p>
</body>
</html>`;
}

// Ouvre le relevé et la boîte d'impression. false si le navigateur bloque
// la fenêtre.
export function printStatement(html: string): boolean {
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
  return true;
}
