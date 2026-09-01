import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = 'DemoBossiz#2026';

const accounts = [
  {
    email: 'demo.admin@bossiz.com',
    full_name: 'Admin Démo',
    role: 'admin',
  },
  {
    email: 'demo.client@bossiz.com',
    full_name: 'Client Démo',
    role: 'user',
  },
  {
    email: 'demo.agence@bossiz.com',
    full_name: 'Agence Démo',
    role: 'sub_agency',
    agency: {
      name: 'Agence Démo Voyages',
      contact_email: 'demo.agence@bossiz.com',
      contact_phone: '+225 00 00 00 00',
      commission_rate: 10,
      is_active: true,
      is_visible: true,
    },
  },
  {
    email: 'demo.majestic@bossiz.com',
    full_name: 'Membre Majestic Démo',
    role: 'user',
    majestic: {
      plan: 'access_prive',
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { demo: true, source: 'seed-demo-accounts' },
    },
  },
];

async function upsertUser(acc) {
  // Try to find existing user by email first (idempotent re-runs)
  let userId = null;
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) throw listErr;
  const existing = list.users.find((u) => u.email === acc.email);

  if (existing) {
    userId = existing.id;
    console.log(`= ${acc.email} already exists (${userId}), updating password/metadata`);
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: acc.full_name, demo_account: true },
    });
    if (updErr) throw updErr;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: acc.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: acc.full_name, demo_account: true },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`+ created ${acc.email} (${userId})`);
  }

  const { error: profErr } = await admin
    .from('profiles')
    .upsert({ id: userId, full_name: acc.full_name }, { onConflict: 'id' });
  if (profErr) throw profErr;

  const { data: existingRole } = await admin
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('role', acc.role)
    .maybeSingle();
  if (!existingRole) {
    const { error: roleErr } = await admin.from('user_roles').insert({ user_id: userId, role: acc.role });
    if (roleErr) throw roleErr;
  }

  if (acc.agency) {
    const { data: existingAgency } = await admin
      .from('agencies')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();
    if (!existingAgency) {
      const { error: agencyErr } = await admin.from('agencies').insert({ owner_id: userId, ...acc.agency });
      if (agencyErr) throw agencyErr;
      console.log(`  + agency created for ${acc.email}`);
    }
  }

  if (acc.majestic) {
    const { data: existingSub } = await admin
      .from('majestic_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (!existingSub) {
      const { error: subErr } = await admin
        .from('majestic_subscriptions')
        .insert({ user_id: userId, ...acc.majestic });
      if (subErr) throw subErr;
      console.log(`  + majestic subscription created for ${acc.email}`);
    } else {
      const { error: subUpdErr } = await admin
        .from('majestic_subscriptions')
        .update(acc.majestic)
        .eq('user_id', userId);
      if (subUpdErr) throw subUpdErr;
    }
  }

  return { email: acc.email, userId, role: acc.role };
}

const results = [];
for (const acc of accounts) {
  results.push(await upsertUser(acc));
}

console.log('\nDone. Demo accounts:');
console.table(results);
console.log(`\nPassword for all demo accounts: ${DEMO_PASSWORD}`);
