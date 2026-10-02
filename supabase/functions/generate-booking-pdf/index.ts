import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingPDFRequest {
  bookingId: string;
}

const generateQRCodeSVG = async (data: string): Promise<string> => {
  const QRCode = await import("https://esm.sh/qrcode@1.5.3");
  return await QRCode.toString(data, { type: "svg", width: 200 });
};

// Template colors based on service type
const getTemplateColors = (serviceType: string) => {
  const templates = {
    flight: {
      primary: "#192342", // Bleu foncé Bossiz
      secondary: "#00F59B", // Vert clair Bossiz
      accent: "#2d3e6f",
      gradient: "linear-gradient(135deg, #192342 0%, #2d3e6f 100%)",
    },
    hotel: {
      primary: "#00b894", // Vert turquoise
      secondary: "#00F59B",
      accent: "#00a389",
      gradient: "linear-gradient(135deg, #00b894 0%, #00d2a0 100%)",
    },
    tour: {
      primary: "#ff6b35", // Orange aventure
      secondary: "#f7931e",
      accent: "#ff8555",
      gradient: "linear-gradient(135deg, #ff6b35 0%, #ff8555 100%)",
    },
    car: {
      primary: "#2d3436", // Gris foncé
      secondary: "#636e72",
      accent: "#3d4446",
      gradient: "linear-gradient(135deg, #2d3436 0%, #3d4446 100%)",
    },
    event: {
      primary: "#6c5ce7", // Violet festif
      secondary: "#a29bfe",
      accent: "#7c6eee",
      gradient: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)",
    },
    flight_hotel: {
      primary: "#192342",
      secondary: "#00b894",
      accent: "#2d3e6f",
      gradient: "linear-gradient(135deg, #192342 0%, #00b894 100%)",
    },
    stay: {
      primary: "#0891b2", // Cyan pour les séjours
      secondary: "#06b6d4",
      accent: "#0e7490",
      gradient: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
    },
    activity: {
      primary: "#ea580c", // Orange pour les activités
      secondary: "#f97316",
      accent: "#c2410c",
      gradient: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
    },
    train: {
      primary: "#dc2626", // Rouge pour les trains
      secondary: "#ef4444",
      accent: "#b91c1c",
      gradient: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
    },
  };
  
  return templates[serviceType as keyof typeof templates] || templates.flight;
};

const generatePDFHTML = (booking: any, qrCodeSvg: string): string => {
  const startDate = new Date(booking.start_date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const startTime = new Date(booking.start_date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const endDate = booking.end_date
    ? new Date(booking.end_date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const serviceType = booking.services?.type || "flight";
  const colors = getTemplateColors(serviceType);
  const statusColor = booking.status === "confirmed" ? "#10b981" : booking.status === "pending" ? "#f59e0b" : "#64748b";
  const statusText = booking.status === "confirmed" ? "CONFIRMÉ" : booking.status === "pending" ? "EN ATTENTE" : booking.status.toUpperCase();
  
  // Service type labels in French
  const serviceTypeLabels: Record<string, string> = {
    flight: "VOL",
    hotel: "HÔTEL",
    tour: "CIRCUIT",
    car: "LOCATION VOITURE",
    event: "ÉVÉNEMENT",
    flight_hotel: "VOL + HÔTEL",
    stay: "SÉJOUR",
    activity: "ACTIVITÉ",
    train: "TRAIN",
  };

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
            padding: 0;
            margin: 0;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 40px rgba(0,0,0,0.1);
          }
          .ticket {
            display: flex;
            min-height: 500px;
          }
          .left-section {
            flex: 1;
            background: white;
            padding: 40px;
            position: relative;
          }
          .right-section {
            width: 280px;
            background: ${colors.gradient};
            color: white;
            padding: 40px 30px;
            position: relative;
          }
          .header {
            margin-bottom: 40px;
          }
          .logo {
            font-size: 28px;
            font-weight: 900;
            color: ${colors.primary};
            margin-bottom: 5px;
            letter-spacing: 1px;
          }
          .company-name {
            font-size: 13px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .booking-class {
            background: ${colors.primary};
            color: white;
            padding: 15px 25px;
            text-align: center;
            font-size: 22px;
            font-weight: 900;
            letter-spacing: 2px;
            margin: 30px 0;
            border-radius: 4px;
          }
          .info-row {
            margin-bottom: 25px;
          }
          .info-label {
            font-size: 10px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
            font-weight: 600;
          }
          .info-value {
            font-size: 16px;
            color: #1a1a1a;
            font-weight: 700;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 25px;
            margin-top: 30px;
          }
          .divider {
            height: 2px;
            background: #e5e5e5;
            margin: 30px 0;
          }
          .right-logo {
            font-size: 24px;
            font-weight: 900;
            text-align: center;
            margin-bottom: 30px;
            letter-spacing: 1px;
          }
          .status-badge {
            background: ${statusColor};
            padding: 8px 15px;
            border-radius: 20px;
            text-align: center;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 30px;
          }
          .right-info {
            margin-bottom: 25px;
          }
          .right-label {
            font-size: 9px;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
          }
          .right-value {
            font-size: 15px;
            font-weight: 700;
          }
          .qr-section {
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
          }
          .qr-code {
            background: white;
            padding: 15px;
            border-radius: 8px;
            display: inline-block;
          }
          .barcode {
            margin-top: 30px;
            text-align: center;
          }
          .barcode-lines {
            display: flex;
            justify-content: center;
            gap: 2px;
            margin-bottom: 10px;
          }
          .barcode-line {
            width: 2px;
            height: 40px;
            background: #1a1a1a;
          }
          .barcode-line:nth-child(even) {
            height: 50px;
          }
          .barcode-text {
            font-size: 12px;
            color: #666;
            letter-spacing: 3px;
            font-weight: 600;
          }
          .price-section {
            background: ${colors.secondary}22;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
            border: 2px solid ${colors.secondary};
          }
          .price-label {
            font-size: 11px;
            color: ${colors.primary};
            text-transform: uppercase;
            margin-bottom: 5px;
            font-weight: 600;
          }
          .price-value {
            font-size: 28px;
            color: ${colors.primary};
            font-weight: 900;
          }
          .footer-note {
            margin-top: 30px;
            padding: 15px;
            background: #f9fafb;
            border-left: 4px solid ${colors.primary};
            font-size: 11px;
            color: #666;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="ticket">
            <!-- Section gauche blanche -->
            <div class="left-section">
              <div class="header">
                <div class="logo">BOSSIZ+</div>
                <div class="company-name">Travel & Tourism</div>
              </div>

              <div class="booking-class">
                ${serviceTypeLabels[serviceType] || serviceType.toUpperCase()}
              </div>

              <div class="info-row">
                <div class="info-label">Nom du voyageur</div>
                <div class="info-value">${booking.customer_name.toUpperCase()}</div>
              </div>

              <div class="info-row">
                <div class="info-label">Référence de réservation</div>
                <div class="info-value">${booking.id.substring(0, 12).toUpperCase()}</div>
              </div>

              <div class="divider"></div>

              <div class="info-grid">
                <div class="info-row">
                  <div class="info-label">Service</div>
                  <div class="info-value">${booking.services.name}</div>
                </div>

                <div class="info-row">
                  <div class="info-label">Destination</div>
                  <div class="info-value">${booking.services.location}</div>
                </div>

                <div class="info-row">
                  <div class="info-label">Date de départ</div>
                  <div class="info-value">${startDate}</div>
                </div>

                <div class="info-row">
                  <div class="info-label">Heure</div>
                  <div class="info-value">${startTime}</div>
                </div>

                <div class="info-row">
                  <div class="info-label">Voyageurs</div>
                  <div class="info-value">${booking.guests} ${booking.guests > 1 ? "Personnes" : "Personne"}</div>
                </div>

                <div class="info-row">
                  <div class="info-label">Téléphone</div>
                  <div class="info-value">${booking.customer_phone}</div>
                </div>
              </div>

              <div class="price-section">
                <div class="price-label">Montant total</div>
                <div class="price-value">${booking.total_price.toLocaleString()} ${booking.currency}</div>
              </div>

              <div class="barcode">
                <div class="barcode-lines">
                  ${Array(30).fill(0).map((_, i) => `<div class="barcode-line" style="height: ${i % 3 === 0 ? '50px' : i % 2 === 0 ? '45px' : '40px'}"></div>`).join('')}
                </div>
                <div class="barcode-text">${booking.id.substring(0, 16).toUpperCase()}</div>
              </div>

              ${booking.notes ? `
                <div class="footer-note">
                  <strong>⚠️ Note importante:</strong><br>
                  ${booking.notes}
                </div>
              ` : ''}
            </div>

            <!-- Section droite avec gradient personnalisé -->
            <div class="right-section">
              <div class="right-logo">BOSSIZ+</div>
              
              <div class="status-badge">
                ${statusText}
              </div>

              <div class="right-info">
                <div class="right-label">Type de réservation</div>
                <div class="right-value">${serviceTypeLabels[serviceType] || serviceType.toUpperCase()}</div>
              </div>

              ${endDate ? `
                <div class="right-info">
                  <div class="right-label">Date de retour</div>
                  <div class="right-value">${endDate}</div>
                </div>
              ` : ''}

              <div class="right-info">
                <div class="right-label">Email</div>
                <div class="right-value" style="font-size: 12px; word-break: break-all;">${booking.customer_email}</div>
              </div>

              <div class="right-info">
                <div class="right-label">Statut paiement</div>
                <div class="right-value">${booking.payment_status === "paid" ? "PAYÉ" : booking.payment_status === "pending" ? "EN ATTENTE" : booking.payment_status.toUpperCase()}</div>
              </div>

              <div class="qr-section">
                <div class="qr-code">
                  ${qrCodeSvg}
                </div>
              </div>
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

    const { bookingId }: BookingPDFRequest = await req.json();

    console.log("Generating PDF for booking:", bookingId);

    // Fetch booking details
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        *,
        services (
          name,
          type,
          location
        )
      `)
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      throw new Error("Booking not found");
    }

    // Generate QR code with booking info
    const qrData = JSON.stringify({
      id: booking.id,
      customer: booking.customer_name,
      service: booking.services.name,
      date: booking.start_date,
      ref: booking.id.substring(0, 8).toUpperCase(),
    });

    const qrCodeSvg = await generateQRCodeSVG(qrData);
    const pdfHTML = generatePDFHTML(booking, qrCodeSvg);

    return new Response(
      JSON.stringify({
        success: true,
        html: pdfHTML,
        bookingRef: booking.id.substring(0, 8).toUpperCase(),
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
    console.error("Error generating booking PDF:", error);
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
