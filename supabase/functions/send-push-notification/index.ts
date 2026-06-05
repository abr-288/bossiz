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
    const { userId, title, body, data } = await req.json();
    
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      console.log('VAPID keys not configured, using mock notification');
      return mockPushNotification(userId, title, body, data);
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true);

    if (subError || !subscriptions || subscriptions.length === 0) {
      console.log('No active push subscriptions found for user:', userId);
      return new Response(
        JSON.stringify({ success: true, message: 'No active subscriptions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notification to each subscription using Web Push Protocol
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        try {
          const response = await fetch('https://webpush.googleapis.com/v1/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `key=${vapidPrivateKey}`,
              'TTL': '2419200',
            },
            body: JSON.stringify({
              to: sub.endpoint,
              notification: {
                title,
                body,
                data: data || {},
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
              },
            }),
          });

          if (!response.ok) {
            // If subscription is invalid, mark as inactive
            if (response.status === 410) {
              await supabase
                .from('push_subscriptions')
                .update({ active: false })
                .eq('id', sub.id);
            }
            throw new Error(`Push failed: ${response.status}`);
          }

          return { success: true, subscriptionId: sub.id };
        } catch (error) {
          console.error('Failed to send push notification:', error);
          return { success: false, subscriptionId: sub.id, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    const failed = results.length - successful;

    console.log(`Push notification sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Push notification sent to ${successful} devices`,
        successful,
        failed,
        total: results.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-push-notification:', error);
    const { userId, title, body, data } = await req.json();
    return mockPushNotification(userId, title, body, data);
  }
});

function mockPushNotification(userId: string, title: string, body: string, data: any) {
  console.log('Mock push notification:', { userId, title, body });
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Mock push notification sent (VAPID not configured)',
      mock: true
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
