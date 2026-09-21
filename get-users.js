import { createClient } from '@supabase/supabase-js';

// Configuration Supabase - jamais de clé en dur ici (service_role contourne
// toutes les RLS). Fournir SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY en
// variables d'environnement avant d'exécuter ce script.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function getUsers() {
  try {
    console.log('Récupération des utilisateurs...\n');
    
    // Récupérer tous les utilisateurs
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return;
    }
    
    if (users && users.length > 0) {
      console.log(`Trouvé ${users.length} utilisateur(s):\n`);
      console.log('ID\t\t\tEmail\t\t\tNom\t\t\tCréé le');
      console.log('=' .repeat(80));
      
      users.forEach((user, index) => {
        const createdDate = new Date(user.created_at).toLocaleDateString('fr-FR');
        console.log(`${user.id.substring(0, 8)}...\t${user.email || 'N/A'}\t\t${user.full_name || 'N/A'}\t\t${createdDate}`);
      });
      
      console.log('\nDétails complets:');
      console.log(JSON.stringify(users, null, 2));
    } else {
      console.log('Aucun utilisateur trouvé dans la table profiles.');
    }
    
    // Vérifier aussi la table auth.users
    console.log('\nVérification de la table auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('Impossible d\'accéder à auth.users (permissions requises)');
    } else {
      console.log(`Trouvé ${authUsers.users.length} utilisateur(s) dans auth.users:\n`);
      authUsers.users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Créé le: ${new Date(user.created_at).toLocaleDateString('fr-FR')}`);
        console.log(`   Confirmé: ${user.email_confirmed_at ? 'Oui' : 'Non'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter la fonction
getUsers();
