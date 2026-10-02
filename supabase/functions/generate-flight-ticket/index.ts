import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketRequest {
  bookingId: string;
}

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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { bookingId }: TicketRequest = await req.json();

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        services (
          name,
          type,
          description,
          location,
          destination
        )
      `)
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found or unauthorized");
    }

    // Generate QR code data
    const qrData = {
      bookingId: booking.id,
      passenger: booking.customer_name,
      from: booking.services.destination,
      to: booking.services.location,
      date: booking.start_date,
      flight: booking.booking_details?.airline || "N/A",
    };
    const qrDataString = JSON.stringify(qrData);

    // Generate QR code using a simple SVG-based approach
    const qrCodeSvg = await generateQRCodeSVG(qrDataString);

    // Create ticket HTML with embedded QR code
    const ticketHtml = `
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
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px;
            }
            .ticket-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .ticket-header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px;
              text-align: center;
            }
            .ticket-header h1 {
              font-size: 36px;
              margin-bottom: 10px;
            }
            .ticket-header p {
              font-size: 18px;
              opacity: 0.9;
            }
            .ticket-body {
              padding: 40px;
            }
            .route-section {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin: 30px 0;
              padding: 30px;
              background: #f8f9fa;
              border-radius: 12px;
            }
            .airport {
              text-align: center;
              flex: 1;
            }
            .airport-code {
              font-size: 48px;
              font-weight: bold;
              color: #667eea;
              margin-bottom: 8px;
            }
            .airport-name {
              font-size: 14px;
              color: #666;
            }
            .flight-arrow {
              font-size: 32px;
              color: #764ba2;
              margin: 0 20px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin: 30px 0;
            }
            .info-item {
              padding: 20px;
              background: #f8f9fa;
              border-radius: 8px;
              border-left: 4px solid #667eea;
            }
            .info-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 8px;
            }
            .info-value {
              font-size: 18px;
              font-weight: 600;
              color: #333;
            }
            .qr-section {
              margin-top: 40px;
              padding: 30px;
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              border-radius: 12px;
              text-align: center;
            }
            .qr-section h3 {
              margin-bottom: 20px;
              color: #333;
            }
            .qr-code {
              display: inline-block;
              padding: 20px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .barcode {
              margin-top: 30px;
              text-align: center;
            }
            .barcode-lines {
              display: flex;
              justify-content: center;
              gap: 2px;
              margin: 15px 0;
            }
            .barcode-line {
              width: 3px;
              background: #333;
            }
            .booking-ref {
              font-family: 'Courier New', monospace;
              font-size: 24px;
              font-weight: bold;
              color: #333;
              letter-spacing: 4px;
            }
            .footer {
              padding: 30px;
              background: #f8f9fa;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .important-notice {
              margin-top: 30px;
              padding: 20px;
              background: #fff3cd;
              border: 1px solid #ffc107;
              border-radius: 8px;
            }
            .important-notice h4 {
              color: #856404;
              margin-bottom: 10px;
            }
            .important-notice ul {
              list-style: none;
              color: #856404;
            }
            .important-notice li {
              margin: 8px 0;
              padding-left: 20px;
              position: relative;
            }
            .important-notice li:before {
              content: "⚠️";
              position: absolute;
              left: 0;
            }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            <div class="ticket-header">
              <h1>✈️ Billet d'Avion</h1>
              <p>Bossiz+ Travel - Votre partenaire voyage</p>
            </div>

            <div class="ticket-body">
              <div class="route-section">
                <div class="airport">
                  <div class="airport-code">${booking.services.destination || "N/A"}</div>
                  <div class="airport-name">Départ</div>
                </div>
                <div class="flight-arrow">✈️</div>
                <div class="airport">
                  <div class="airport-code">${booking.services.location || "N/A"}</div>
                  <div class="airport-name">Arrivée</div>
                </div>
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Passager</div>
                  <div class="info-value">${booking.customer_name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">N° Réservation</div>
                  <div class="info-value">${booking.id.substring(0, 8).toUpperCase()}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Date de départ</div>
                  <div class="info-value">${new Date(booking.start_date).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</div>
                </div>
                ${booking.end_date !== booking.start_date ? `
                <div class="info-item">
                  <div class="info-label">Date de retour</div>
                  <div class="info-value">${new Date(booking.end_date).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</div>
                </div>
                ` : ''}
                <div class="info-item">
                  <div class="info-label">Compagnie</div>
                  <div class="info-value">${booking.booking_details?.airline || "N/A"}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Classe</div>
                  <div class="info-value">${booking.booking_details?.class || "Économique"}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Passagers</div>
                  <div class="info-value">${booking.guests}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">N° Passeport</div>
                  <div class="info-value">${booking.booking_details?.passportNumber || "N/A"}</div>
                </div>
              </div>

              <div class="qr-section">
                <h3>Scannez ce code à l'aéroport</h3>
                <div class="qr-code">
                  ${qrCodeSvg}
                </div>
              </div>

              <div class="barcode">
                <div class="barcode-lines">
                  ${Array(50).fill(0).map((_, i) => 
                    `<div class="barcode-line" style="height: ${Math.random() > 0.5 ? '60' : '40'}px"></div>`
                  ).join('')}
                </div>
                <div class="booking-ref">${booking.id.substring(0, 8).toUpperCase()}</div>
              </div>

              <div class="important-notice">
                <h4>⚠️ Informations importantes</h4>
                <ul>
                  <li>Présentez-vous à l'aéroport au moins 2 heures avant le départ</li>
                  <li>Vérifiez la validité de votre passeport (validité min. 6 mois)</li>
                  <li>Conservez ce billet et votre pièce d'identité</li>
                  <li>En cas de problème, contactez notre service client</li>
                </ul>
              </div>
            </div>

            <div class="footer">
              <p>Prix total: ${booking.total_price.toLocaleString()} ${booking.currency}</p>
              <p style="margin-top: 10px;">Merci d'avoir choisi Bossiz+ Travel</p>
              <p style="margin-top: 5px;">Email: ${booking.customer_email} | Tél: ${booking.customer_phone}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const htmlBase64 = encode(new TextEncoder().encode(ticketHtml).buffer);

    console.log("Flight ticket generated successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        ticket: ticketHtml,
        ticketBase64: htmlBase64 
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
    console.error("Error generating flight ticket:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Simple QR code SVG generator
async function generateQRCodeSVG(data: string): Promise<string> {
  // For production, you'd use a proper QR code library
  // This is a simplified version that creates a placeholder
  const size = 200;
  const modules = 25;
  const moduleSize = size / modules;
  
  // Create a simple pattern based on the data
  const hash = Array.from(data).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  let paths = '';
  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      // Create a deterministic pattern based on position and data
      const value = (x * y + hash + x + y) % 2;
      if (value === 0) {
        paths += `<rect x="${x * moduleSize}" y="${y * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#000"/>`;
      }
    }
  }

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#fff"/>
      ${paths}
    </svg>
  `;
}

serve(handler);
