import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const tables = [
  'majestic_bookings',
  'majestic_documents',
  'majestic_itineraries',
  'majestic_messages',
  'majestic_notifications',
  'majestic_payments',
  'majestic_properties',
  'majestic_service_requests',
  'majestic_services',
  'majestic_subscriptions',
  'majestic_transactions',
  'concierge_requests',
  'vip_events',
  'vip_event_registrations',
  'concierge_staff',
  'exclusive_services',
  'service_bookings',
  'assistance_logs',
];

const outDir = process.argv[2];
fs.mkdirSync(outDir, { recursive: true });

const summary = {};
for (const table of tables) {
  const { data, error } = await admin.from(table).select('*');
  if (error) {
    console.error(`Error reading ${table}:`, error.message);
    summary[table] = { error: error.message };
    continue;
  }
  fs.writeFileSync(path.join(outDir, `${table}.json`), JSON.stringify(data, null, 2));
  summary[table] = { rows: data.length };
  console.log(`${table}: ${data.length} rows -> ${table}.json`);
}

fs.writeFileSync(path.join(outDir, '_summary.json'), JSON.stringify(summary, null, 2));
console.log('\nBackup complete:', outDir);
