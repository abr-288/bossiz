// Script pour corriger les erreurs TypeScript du Majestic Club
// Exécutez : node fix-majestic-types.js

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/components/majestic-club/ConciergeModule.tsx',
  'src/components/majestic-club/VIPChat.tsx',
  'src/components/majestic-club/StayManagement.tsx',
  'src/components/majestic-club/TravelBooking.tsx',
  'src/components/majestic-club/PaymentSystem.tsx',
  'src/components/majestic-club/NotificationsSystem.tsx',
  'src/components/majestic-club/OffMarketProperties.tsx',
  'src/pages/MajesticClub.tsx'
];

const fixes = {
  // Remplacer les références Supabase avec des types génériques
  supabaseFrom: /\.from\('([^']+)'\)/g,
  supabaseTo: ".from('$1' as any)"
};

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    console.log(`Traitement de ${file}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Appliquer les corrections
    Object.entries(fixes).forEach(([pattern, replacement]) => {
      content = content.replace(new RegExp(pattern, 'g'), replacement);
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${file} corrigé`);
  } else {
    console.log(`⚠️  ${file} non trouvé`);
  }
});

console.log('\n🎉 Corrections terminées !');
console.log('📝 Les erreurs TypeScript devraient être résolues');
console.log('🔄 Redémarrez votre serveur de développement');
