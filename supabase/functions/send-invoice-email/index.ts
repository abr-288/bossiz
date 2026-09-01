import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/integrations.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerEmail, customerName, invoiceNumber, invoiceDate, items, subtotal, tax, total, currency, paymentMethod } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Sending invoice email to:', customerEmail);

    const emailHtml = generateInvoiceEmailHtml(customerName, invoiceNumber, invoiceDate, items, subtotal, tax, total, currency, paymentMethod);

    const result = await sendEmail(supabase, {
      from: 'B-Reserve <noreply@bossiz.com>',
      to: [customerEmail],
      subject: `Invoice ${invoiceNumber}`,
      html: emailHtml,
    });

    if (!result.ok) {
      if (result.error === 'RESEND_API_KEY not configured') {
        console.log('Aucun prestataire email configuré, envoi ignoré');
        return new Response(
          JSON.stringify({ success: true, message: 'Email skipped (no provider configured)' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Email send error:', result.error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Invoice email sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invoice email sent successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-invoice-email:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function generateInvoiceEmailHtml(customerName: string, invoiceNumber: string, invoiceDate: string, items: any[], subtotal: number, tax: number, total: number, currency: string, paymentMethod: string) {
  const itemsList = items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.unitPrice} ${currency}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.total} ${currency}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .invoice-details { background: white; padding: 20px; margin: 10px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f3f4f6; padding: 10px; text-align: left; }
        .total { font-weight: bold; font-size: 18px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>INVOICE</h1>
        </div>
        <div class="content">
          <div class="invoice-details">
            <h3>Invoice Details</h3>
            <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
            <p><strong>Date:</strong> ${invoiceDate}</p>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
          </div>

          <div class="invoice-details">
            <h3>Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
            </table>
          </div>

          <div class="invoice-details">
            <p style="text-align: right;"><strong>Subtotal:</strong> ${subtotal} ${currency}</p>
            <p style="text-align: right;"><strong>Tax:</strong> ${tax} ${currency}</p>
            <p style="text-align: right;" class="total"><strong>Total:</strong> ${total} ${currency}</p>
          </div>

          <p>Thank you for your business!</p>
          <p>Best regards,<br>The B-Reserve Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 B-Reserve. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
