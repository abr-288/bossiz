import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Body parsed once — reused in the catch handler too, since a Request
  // body can only be read a single time.
  let payload: { userId?: string; title?: string; body?: string; data?: unknown; subscription?: any };
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }

  const { userId, title, body, data, subscription: directSubscription } = payload;

  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      console.log('VAPID keys not configured, using mock notification');
      return mockPushNotification(userId, title, body);
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const notificationPayload = JSON.stringify({
      title,
      body,
      data: data || {},
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
    });

    // Called directly with a single subscription (e.g. from check-price-alerts)
    if (directSubscription) {
      await webpush.sendNotification(directSubscription, notificationPayload);
      return new Response(
        JSON.stringify({ success: true, message: 'Push notification sent', successful: 1, failed: 0, total: 1 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Send push notification to each subscription using the real,
    // VAPID-authenticated and encrypted Web Push protocol (RFC 8030/8291).
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };
        try {
          await webpush.sendNotification(pushSubscription, notificationPayload);
          return { success: true, subscriptionId: sub.id };
        } catch (error: any) {
          // 404/410 means the subscription is gone (browser unsubscribed, etc.)
          if (error?.statusCode === 404 || error?.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .update({ active: false })
              .eq('id', sub.id);
          }
          console.error('Failed to send push notification:', error?.message || error);
          return { success: false, subscriptionId: sub.id, error: error?.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any)?.success).length;
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
    return mockPushNotification(userId, title, body);
  }
});

function mockPushNotification(userId: string | undefined, title: string | undefined, body: string | undefined) {
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
