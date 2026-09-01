import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const dedicatedTables = [
  'majestic_bookings',
  'majestic_documents',
  'majestic_itineraries',
  'majestic_messages',
  'majestic_notifications',
  'majestic_payments',
  'majestic_service_requests',
  'majestic_services',
  'majestic_subscriptions',
  'majestic_transactions',
  'majestic_properties',
  'concierge_requests',
  'vip_event_registrations',
  'vip_events',
  'service_bookings',
  'exclusive_services',
  'assistance_logs',
  'concierge_staff',
];

for (const table of dedicatedTables) {
  const { error, count } = await admin.from(table).delete({ count: 'exact' }).not('id', 'is', null);
  if (error) {
    console.error(`! ${table}: ${error.message}`);
  } else {
    console.log(`- ${table}: ${count ?? '?'} rows deleted`);
  }
}

// Shared tables: remove only majestic-typed rows
const { error: spErr, count: spCount } = await admin
  .from('subscription_plans')
  .delete({ count: 'exact' })
  .eq('subscription_type', 'majestic');
console.log(spErr ? `! subscription_plans: ${spErr.message}` : `- subscription_plans (majestic rows): ${spCount ?? '?'} deleted`);

const { error: usErr, count: usCount } = await admin
  .from('user_subscriptions')
  .delete({ count: 'exact' })
  .eq('subscription_type', 'majestic');
console.log(usErr ? `! user_subscriptions: ${usErr.message}` : `- user_subscriptions (majestic rows): ${usCount ?? '?'} deleted`);

const { error: pricErr, count: pricCount } = await admin
  .from('subscription_pricing')
  .delete({ count: 'exact' })
  .like('plan_id', 'majestic%');
console.log(pricErr ? `! subscription_pricing: ${pricErr.message}` : `- subscription_pricing (majestic rows): ${pricCount ?? '?'} deleted`);

console.log('\nDone.');
