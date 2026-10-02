import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionReceiptRequest {
  subscriptionRequestId: string;
}

const generateQRCodeSVG = async (data: string): Promise<string> => {
  const QRCode = await import("https://esm.sh/qrcode@1.5.3");
  return await QRCode.toString(data, { type: "svg", width: 150 });
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const generateReceiptHTML = (subscription: any, plan: any, qrCodeSvg: string): string => {
  const receiptNumber = `REC-${subscription.id.substring(0, 8).toUpperCase()}`;
  const paymentDate = formatDate(new Date(subscription.updated_at));
  
  // Extraire le montant du prix du plan
  const priceMatch = plan?.price?.replace(/\s/g, '').match(/(\d+)/);
  const amount = priceMatch ? parseInt(priceMatch[1], 10) : 0;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            background: #f5f5f5;
            padding: 20px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 40px;
            text-align: center;
          }
          .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
          }
          .header p {
            font-size: 16px;
            opacity: 0.9;
          }
          .receipt-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 14px;
            margin-top: 15px;
          }
          .content {
            padding: 40px;
          }
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e5e5;
          }
          .info-block {
            text-align: left;
          }
          .info-block.right {
            text-align: right;
          }
          .info-label {
            font-size: 11px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
          }
          .info-value {
            font-size: 16px;
            font-weight: 700;
            color: #1a1a1a;
          }
          .customer-section {
            background: #f9fafb;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 14px;
            color: #10b981;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
          }
          .customer-row {
            display: flex;
            margin-bottom: 10px;
          }
          .customer-label {
            width: 120px;
            color: #666;
            font-size: 14px;
          }
          .customer-value {
            font-weight: 600;
            color: #1a1a1a;
            font-size: 14px;
          }
          .plan-section {
            border: 2px solid #10b981;
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 30px;
          }
          .plan-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .plan-name {
            font-size: 22px;
            font-weight: 800;
            color: #1a1a1a;
          }
          .plan-status {
            background: #10b981;
            color: white;
            padding: 6px 15px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 700;
          }
          .plan-price {
            font-size: 28px;
            font-weight: 900;
            color: #10b981;
            margin: 10px 0;
          }
          .plan-features {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
          }
          .feature-item {
            display: flex;
            align-items: center;
            padding: 8px 0;
            font-size: 14px;
            color: #555;
          }
          .feature-icon {
            color: #10b981;
            margin-right: 10px;
            font-weight: bold;
          }
          .totals-section {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 30px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 15px;
          }
          .total-row.final {
            font-size: 22px;
            font-weight: 900;
            color: #10b981;
            border-top: 2px solid #10b981;
            padding-top: 15px;
            margin-top: 10px;
          }
          .qr-section {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 30px;
            padding: 30px;
            background: #f9fafb;
            border-radius: 10px;
            margin-bottom: 30px;
          }
          .qr-code {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .qr-text {
            text-align: left;
          }
          .qr-title {
            font-size: 16px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 5px;
          }
          .qr-desc {
            font-size: 13px;
            color: #666;
          }
          .footer {
            text-align: center;
            padding: 30px;
            background: #1a1a1a;
            color: white;
          }
          .footer-logo {
            font-size: 22px;
            font-weight: 900;
            margin-bottom: 10px;
          }
          .footer-text {
            font-size: 13px;
            opacity: 0.7;
            line-height: 1.8;
          }
          .footer-contact {
            margin-top: 15px;
            font-size: 12px;
            opacity: 0.8;
          }
          @media print {
            body {
              padding: 0;
              background: white;
            }
            .container {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧾 REÇU D'ABONNEMENT</h1>
            <p>Confirmation de paiement</p>
            <div class="receipt-badge">PAYÉ ET CONFIRMÉ ✓</div>
          </div>

          <div class="content">
            <div class="receipt-info">
              <div class="info-block">
                <div class="info-label">Numéro de reçu</div>
                <div class="info-value">${receiptNumber}</div>
              </div>
              <div class="info-block">
                <div class="info-label">Date de paiement</div>
                <div class="info-value">${paymentDate}</div>
              </div>
              <div class="info-block right">
                <div class="info-label">Référence</div>
                <div class="info-value">${subscription.id.substring(0, 12).toUpperCase()}</div>
              </div>
            </div>

            <div class="customer-section">
              <div class="section-title">Informations client</div>
              <div class="customer-row">
                <div class="customer-label">Nom</div>
                <div class="customer-value">${subscription.name}</div>
              </div>
              <div class="customer-row">
                <div class="customer-label">Email</div>
                <div class="customer-value">${subscription.email}</div>
              </div>
              <div class="customer-row">
                <div class="customer-label">Téléphone</div>
                <div class="customer-value">${subscription.phone}</div>
              </div>
              ${subscription.company ? `
              <div class="customer-row">
                <div class="customer-label">Entreprise</div>
                <div class="customer-value">${subscription.company}</div>
              </div>
              ` : ''}
            </div>

            <div class="plan-section">
              <div class="plan-header">
                <div class="plan-name">${plan?.name || subscription.plan_name}</div>
                <div class="plan-status">ACTIF</div>
              </div>
              <div class="plan-price">${plan?.price || 'N/A'}</div>
              ${plan?.subtitle ? `<p style="color: #666; font-size: 14px;">${plan.subtitle}</p>` : ''}
              
              ${plan?.features && plan.features.length > 0 ? `
              <div class="plan-features">
                <div class="section-title">Services inclus</div>
                ${plan.features.slice(0, 6).map((feature: string) => `
                  <div class="feature-item">
                    <span class="feature-icon">✓</span>
                    <span>${feature}</span>
                  </div>
                `).join('')}
                ${plan.features.length > 6 ? `
                  <div class="feature-item" style="color: #10b981; font-style: italic;">
                    + ${plan.features.length - 6} autres avantages...
                  </div>
                ` : ''}
              </div>
              ` : ''}
            </div>

            <div class="totals-section">
              <div class="total-row">
                <span>Abonnement ${plan?.name || subscription.plan_name}</span>
                <span>${amount.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div class="total-row">
                <span>Taxes et frais</span>
                <span>Inclus</span>
              </div>
              <div class="total-row final">
                <span>TOTAL PAYÉ</span>
                <span>${amount.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            <div class="qr-section">
              <div class="qr-code">
                ${qrCodeSvg}
              </div>
              <div class="qr-text">
                <div class="qr-title">Scannez pour vérifier</div>
                <div class="qr-desc">Ce QR code contient les informations<br>de votre abonnement</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-logo">CONCIERGERIE BOSSIZ</div>
            <div class="footer-text">
              Votre partenaire de confiance pour tous vos voyages<br>
              Merci de votre confiance !
            </div>
            <div class="footer-contact">
              📧 support@bossiz.com | 📱 +225 XX XX XX XX
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { subscriptionRequestId }: SubscriptionReceiptRequest = await req.json();

    console.log("Generating receipt for subscription:", subscriptionRequestId);

    // Fetch subscription request details
    const { data: subscription, error: subError } = await supabase
      .from("subscription_requests")
      .select("*")
      .eq("id", subscriptionRequestId)
      .single();

    if (subError || !subscription) {
      throw new Error("Subscription request not found");
    }

    // Fetch plan details
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("plan_id", subscription.plan_id)
      .single();

    // Generate QR code with subscription info
    const qrData = JSON.stringify({
      id: subscription.id,
      customer: subscription.name,
      plan: subscription.plan_name,
      date: subscription.updated_at,
      ref: subscription.id.substring(0, 8).toUpperCase(),
    });

    const qrCodeSvg = await generateQRCodeSVG(qrData);
    const receiptHTML = generateReceiptHTML(subscription, plan, qrCodeSvg);

    return new Response(
      JSON.stringify({
        success: true,
        html: receiptHTML,
        receiptRef: subscription.id.substring(0, 8).toUpperCase(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error generating subscription receipt:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
