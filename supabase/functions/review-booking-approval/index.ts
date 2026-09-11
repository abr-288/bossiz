import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { notifyBookingOwner } from "../_shared/notify.ts";

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
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ success: false, error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { bookingId, decision } = await req.json();
    if (!bookingId || (decision !== 'approved' && decision !== 'rejected')) {
      return new Response(JSON.stringify({ success: false, error: "bookingId and decision ('approved'|'rejected') are required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // User-scoped client: RLS ("Company approvers can review their company
    // bookings", see 20260911000000_travel_policy_and_approvals.sql) is
    // what actually authorizes this - only an approver/admin for the
    // booking's own company can update it. No separate role check needed
    // here; if RLS doesn't allow it, the update below simply matches zero
    // rows.
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ approval_status: decision, approved_by: user.id, approved_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select('id, user_id, total_price, currency, services(name)')
      .single();

    if (error || !booking) {
      return new Response(JSON.stringify({ success: false, error: 'Réservation introuvable ou non autorisée' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const serviceName = (booking as any).services?.name || 'votre réservation';
    const message = decision === 'approved'
      ? `B-Reserve: ${serviceName} (${booking.total_price} ${booking.currency}) a été approuvée. Le paiement va être traité par votre entreprise.`
      : `B-Reserve: ${serviceName} (${booking.total_price} ${booking.currency}) a été rejetée par votre entreprise.`;

    // Best-effort, awaited for the same reason as create-booking (a
    // detached background call risks being killed when the function
    // returns).
    await notifyBookingOwner(booking.user_id, message);

    return new Response(JSON.stringify({ success: true, approval_status: decision }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in review-booking-approval:', error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
