import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://kzuzpqjxlhewgqjwzjhe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6dXpwanp4bGhld2dxand6amhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzU3MjY1MiwiZXhwIjoyMDUzMTQ4NjUyfQ.7FhX_6d6J7W3k8e9m4lF5t6s7d8n9p0q1r2s3t4u5v';

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
    
    // Vérifier s'il y a des administrateurs par défaut dans les variables d'environnement
    console.log('\nVérification des administrateurs par défaut...');
    console.log('Note: Les identifiants administrateur par défaut sont généralement:');
    console.log('- Email: admin@bossiz.com');
    console.log('- Mot de passe: admin123 ou bossiz2024');
    console.log('- Email: contact@bossiz.com');
    console.log('- Mot de passe: bossiz2024');
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter la fonction
findAdminUsers();
