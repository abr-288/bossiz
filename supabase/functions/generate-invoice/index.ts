import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { bookingId } = await req.json();

    // Récupérer les informations de la réservation - la facture n'est
    // générée qu'après paiement confirmé (voir postPaymentSuccess.ts), donc
    // service_name/type viennent de la table services référencée, pas de
    // colonnes booking_type/booking_data qui n'existent pas sur bookings.
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, services(type, name)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Vérifier que la réservation appartient à l'utilisateur
    if (booking.user_id !== user.id) {
      throw new Error('Unauthorized access to booking');
    }

    // Générer un numéro de facture unique
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Le montant facturé doit être EXACTEMENT ce qui a été débité via
    // CinetPay (process-payment ne charge jamais que booking.total_price) -
    // aucune taxe n'est ajoutée après coup, ça ferait diverger la facture du
    // paiement réel.
    const totalAmount = Number(booking.total_price);
    const serviceName = booking.services?.name || 'Réservation';
    const serviceType = booking.services?.type || 'other';

    const invoiceMetadata = {
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      customer_phone: booking.customer_phone,
      service_type: serviceType,
      location: booking.booking_details?.pickupLocation || undefined,
    };

    const invoiceItems = [
      {
        description: serviceName,
        service_type: serviceType,
        start_date: booking.start_date,
        end_date: booking.end_date,
        quantity: 1,
        unit_price: totalAmount,
        total: totalAmount,
      },
    ];

    // Enregistrer la facture dans la base de données - déjà payée, puisque
    // ce point n'est atteint qu'après confirmation CinetPay.
    const now = new Date().toISOString();
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        booking_id: bookingId,
        user_id: user.id,
        invoice_number: invoiceNumber,
        amount: totalAmount,
        currency: booking.currency,
        tax_amount: 0,
        total_amount: totalAmount,
        items: invoiceItems,
        metadata: invoiceMetadata,
        status: 'paid',
        paid_date: now,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Database error:', invoiceError);
      throw new Error('Failed to create invoice');
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoice,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-invoice:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});