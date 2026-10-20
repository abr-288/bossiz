import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCaller, isStaff } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Réservé aux appels serveur internes (clé service-role) et aux admins :
  // cette fonction envoie des messages à des destinataires fournis ou
  // résolus côté serveur, elle ne doit pas être un relais public.
  const caller = await getCaller(
    req,
    createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  );
  if (!isStaff(caller)) {
    return new Response(
      JSON.stringify({ success: false, error: caller ? 'Forbidden' : 'Unauthorized' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: caller ? 403 : 401 }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active price alerts
    const { data: alerts, error: alertsError } = await supabaseClient
      .from('price_alerts')
      .select('*')
      .eq('is_active', true);

    if (alertsError) {
      throw alertsError;
    }

    console.log(`Checking ${alerts?.length || 0} active price alerts`);

    const results = [];

    for (const alert of alerts || []) {
      try {
        // Fetch current price based on service type
        let currentPrice = null;

        if (alert.service_type === 'flight' && alert.origin && alert.destination && alert.departure_date) {
          // Call search-flights function
          const { data: flightData } = await supabaseClient.functions.invoke('search-flights', {
            body: {
              origin: alert.origin,
              destination: alert.destination,
              departureDate: alert.departure_date,
              returnDate: alert.return_date,
              adults: alert.passengers || 1,
            }
          });

          if (flightData?.flights && flightData.flights.length > 0) {
            // Get the cheapest flight
            currentPrice = Math.min(...flightData.flights.map((f: { price: number }) => f.price));
          }
        } else if (alert.service_type === 'hotel' && alert.destination && alert.departure_date && alert.return_date) {
          // Call search-hotels function
          const { data: hotelData } = await supabaseClient.functions.invoke('search-hotels', {
            body: {
              destination: alert.destination,
              checkIn: alert.departure_date,
              checkOut: alert.return_date,
              guests: alert.passengers || 1,
              rooms: alert.rooms || 1,
            }
          });

          if (hotelData?.hotels && hotelData.hotels.length > 0) {
            // Get the cheapest hotel
            currentPrice = Math.min(...hotelData.hotels.map((h: { price: number }) => h.price));
          }
        }

        // Check if price has dropped
        if (currentPrice !== null) {
          const priceDropped = alert.current_price && 
            ((alert.current_price - currentPrice) / alert.current_price * 100) >= alert.alert_threshold;

          const targetReached = alert.target_price && currentPrice <= alert.target_price;

          if (priceDropped || targetReached) {
            // Send notification
            const { data: subscriptions } = await supabaseClient
              .from('push_subscriptions')
              .select('*')
              .eq('user_id', alert.user_id);

            if (subscriptions && subscriptions.length > 0) {
              const priceChange = alert.current_price 
                ? Math.round((alert.current_price - currentPrice) / alert.current_price * 100)
                : 0;

              const message = priceDropped
                ? `Prix baissé de ${priceChange}% pour ${alert.destination}!`
                : `Prix cible atteint pour ${alert.destination}!`;

              // Send push notification to all user's devices
              for (const sub of subscriptions) {
                await supabaseClient.functions.invoke('send-push-notification', {
                  body: {
                    subscription: {
                      endpoint: sub.endpoint,
                      keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                      }
                    },
                    title: 'Alerte de Prix - BOSSIZ',
                    body: message,
                    data: {
                      alertId: alert.id,
                      currentPrice,
                      oldPrice: alert.current_price,
                    }
                  }
                });
              }
            }
          }

          // Update alert with new price
          await supabaseClient
            .from('price_alerts')
            .update({
              current_price: currentPrice,
              last_checked_at: new Date().toISOString(),
            })
            .eq('id', alert.id);

          results.push({
            alertId: alert.id,
            currentPrice,
            notified: priceDropped || targetReached,
          });
        }
      } catch (error) {
        console.error(`Error checking alert ${alert.id}:`, error);
        results.push({
          alertId: alert.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: alerts?.length || 0,
        results 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error checking price alerts:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
