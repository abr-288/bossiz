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

async function findAdminUsers() {
  try {
    console.log('Recherche des utilisateurs administrateurs...\n');
    
    // Récupérer tous les utilisateurs avec le rôle 'admin'
    const { data: adminUsers, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin');
    
    if (error) {
      console.error('Erreur lors de la recherche des admins:', error);
      return;
    }
    
    if (adminUsers && adminUsers.length > 0) {
      console.log(`Trouvé ${adminUsers.length} administrateur(s):\n`);
      console.log('ID\t\t\tEmail\t\t\tNom\t\t\tTéléphone\t\tCréé le');
      console.log('=' .repeat(100));
      
      adminUsers.forEach((admin, index) => {
        const createdDate = new Date(admin.created_at).toLocaleDateString('fr-FR');
        console.log(`${admin.id.substring(0, 8)}...\t${admin.email || 'N/A'}\t\t${admin.full_name || 'N/A'}\t\t${admin.phone || 'N/A'}\t${createdDate}`);
      });
      
      console.log('\nDétails complets des administrateurs:');
      console.log(JSON.stringify(adminUsers, null, 2));
    } else {
      console.log('Aucun administrateur trouvé dans la table profiles.');
      
      // Vérifier tous les utilisateurs pour voir les rôles disponibles
      console.log('\nVérification de tous les utilisateurs et leurs rôles...');
      const { data: allUsers, error: allError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role');
      
      if (allError) {
        console.error('Erreur:', allError);
      } else if (allUsers && allUsers.length > 0) {
        console.log(`\nTrouvé ${allUsers.length} utilisateur(s) au total:\n`);
        
        const roles = {};
        allUsers.forEach(user => {
          const role = user.role || 'non défini';
          roles[role] = (roles[role] || 0) + 1;
          
          if (role === 'admin' || role === 'agent') {
            console.log(`🔑 ${role.toUpperCase()}: ${user.email} - ${user.full_name || 'N/A'}`);
          }
        });
        
        console.log('\nRépartition des rôles:');
        Object.entries(roles).forEach(([role, count]) => {
          console.log(`- ${role}: ${count} utilisateur(s)`);
        });
      }
    }
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter la fonction
findAdminUsers();
