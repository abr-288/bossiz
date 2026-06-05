import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://kzuzpqjxlhewgqjwzjhe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6dXpwanp4bGhld2dxand6amhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzU3MjY1MiwiZXhwIjoyMDUzMTQ4NjUyfQ.7FhX_6d6J7W3k8e9m4lF5t6s7d8n9p0q1r2s3t4u5v';

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
