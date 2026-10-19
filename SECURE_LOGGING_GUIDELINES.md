# Guide de Logging Sécurisé - Bossiz+

## 🔒 Principe Fondamental

**JAMAIS** logger des données sensibles dans les edge functions. Les logs sont accessibles par les administrateurs et peuvent être exposés en cas de faille de sécurité.

## ⚠️ Données INTERDITES dans les Logs

### Informations Personnelles (PII)
- ❌ Noms complets des clients
- ❌ Adresses emails
- ❌ Numéros de téléphone
- ❌ Adresses physiques
- ❌ Dates de naissance

### Données Financières
- ❌ Montants exacts des transactions
- ❌ Numéros de carte bancaire (évidemment)
- ❌ Transaction IDs complets
- ❌ Booking IDs complets

### Credentials & Tokens
- ❌ Clés API (CinetPay, Amadeus, etc.)
- ❌ Tokens d'authentification
- ❌ Signatures de paiement
- ❌ Site IDs complets

### Données de Réponse API
- ❌ Réponses complètes de CinetPay
- ❌ Messages d'erreur détaillés des APIs externes
- ❌ Objets complets contenant des données utilisateurs

## ✅ Ce qu'il est PERMIS de Logger

### États et Événements
```typescript
✅ console.log('Payment request initiated');
✅ console.log('Payment verification completed');
✅ console.log('Booking confirmed successfully');
```

### Codes et Statuts (génériques)
```typescript
✅ console.log('Response Code:', responseCode);
✅ console.log('Payment Status:', status === 'ACCEPTED' ? 'success' : 'failed');
✅ console.log('HTTP Status:', response.status);
```

### Types d'Erreurs (sans détails)
```typescript
✅ console.error('Payment processing failed');
✅ console.error('Database update error occurred');
✅ console.error('Verification failed with code:', errorCode);
```

### Métadonnées Non-Sensibles
```typescript
✅ console.log('Payment Method:', paymentMethod);
✅ console.log('Currency:', currency);
✅ console.log('Channels:', channels);
```

## 📋 Exemples de Refactoring

### ❌ AVANT (Non sécurisé)
```typescript
console.log('Customer:', requestData.customerInfo.name);
console.log('Email:', requestData.customerInfo.email);
console.log('Transaction ID:', transactionId);
console.log('Amount:', amount);
console.log('CinetPay response:', JSON.stringify(cinetpayData));
console.error('Error:', error);
```

### ✅ APRÈS (Sécurisé)
```typescript
console.log('Payment request validated');
console.log('Customer data formatted');
console.log('Payment verification completed');
console.log('Currency:', currency);
console.error('Payment processing error:', error instanceof Error ? error.constructor.name : 'Unknown');
```

## 🛡️ Règles par Edge Function

### `process-payment`
- ✅ Logger: méthode de paiement, devise, channels
- ❌ Ne PAS logger: montants, IDs clients, transaction IDs, données personnelles

### `payment-callback`
- ✅ Logger: statut de vérification, étapes du processus
- ❌ Ne PAS logger: données callback complètes, IDs de booking, réponses CinetPay

### `search-*` (flights, hotels, etc.)
- ✅ Logger: nombre de résultats, codes d'erreur API
- ❌ Ne PAS logger: paramètres de recherche complets, données utilisateur

## 🔍 Debugging en Production

Pour le debugging en production sans exposer de données sensibles:

1. **Utiliser des IDs hachés**
```typescript
const hashedId = await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(bookingId)
);
console.log('Processing booking hash:', Array.from(new Uint8Array(hashedId.slice(0, 8))));
```

2. **Logger uniquement les types d'événements**
```typescript
console.log('Event:', 'payment_initiated');
console.log('Event:', 'booking_confirmed');
```

3. **Utiliser des compteurs et métriques**
```typescript
console.log('Successful payments count:', count);
console.log('Failed verifications:', failureCount);
```

## 🚨 Checklist de Review

Avant de déployer une edge function, vérifier:

- [ ] Aucun `console.log()` ne contient d'email, téléphone, ou nom
- [ ] Aucun `console.log()` ne contient de clé API ou token
- [ ] Aucun `JSON.stringify()` d'objets complets contenant des données sensibles
- [ ] Les erreurs loggées ne révèlent pas de structure interne
- [ ] Les IDs loggés sont soit anonymisés, soit inexistants
- [ ] Les montants ne sont pas loggés en clair

## 📝 Modifications Effectuées

### `process-payment/index.ts`
- ✅ Suppression des logs de booking ID, montants, noms clients
- ✅ Suppression des logs de transaction ID complets
- ✅ Suppression des logs de réponses CinetPay complètes
- ✅ Remplacement par des logs d'événements génériques

### `payment-callback/index.ts`
- ✅ Suppression des logs de données callback brutes
- ✅ Suppression des logs de réponses de vérification complètes
- ✅ Suppression des logs de booking IDs et transaction IDs
- ✅ Anonymisation des erreurs

## 🎯 Impact

- **Sécurité**: Aucune donnée sensible n'est plus exposée dans les logs
- **Conformité**: Respect du RGPD et des normes PCI-DSS
- **Debugging**: Toujours possible via les événements et codes d'erreur
- **Performance**: Logs plus légers = meilleure performance

## 📚 Références

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [RGPD Article 32 - Sécurité des traitements](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4#Article32)
- [PCI-DSS Requirement 3.4](https://www.pcisecuritystandards.org/)
