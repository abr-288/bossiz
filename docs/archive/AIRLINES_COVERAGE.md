# Couverture des Compagnies Aériennes

## API Utilisée: Amadeus Flight Offers Search

L'application utilise l'API **Amadeus Flight Offers Search** qui offre la couverture la plus complète du marché aérien mondial.

### Statistiques de Couverture

- **Plus de 500 compagnies aériennes** dans le monde
- **Toutes les alliances** : Star Alliance, SkyTeam, Oneworld
- **Low-cost carriers** : Ryanair, EasyJet, WizzAir, Southwest, etc.
- **Compagnies régionales** africaines, asiatiques, américaines, européennes
- **Mise à jour en temps réel** des disponibilités et prix

### Principales Compagnies Aériennes Prises en Charge

#### Compagnies Internationales Majeures
- **Air France (AF)**
- **British Airways (BA)**
- **Lufthansa (LH)**
- **Emirates (EK)**
- **Qatar Airways (QR)**
- **Turkish Airlines (TK)**
- **KLM (KL)**
- **Swiss International (LX)**
- **United Airlines (UA)**
- **American Airlines (AA)**
- **Delta Air Lines (DL)**

#### Compagnies Africaines
- **Ethiopian Airlines (ET)** - Principal hub africain
- **Kenya Airways (KQ)**
- **South African Airways (SA)**
- **Royal Air Maroc (AT)**
- **EgyptAir (MS)**
- **Air Côte d'Ivoire (HF)**
- **ASKY Airlines (KP)**
- **Air Senegal (HC)**
- **RwandAir (WB)**
- **Air Tanzania (TC)**

#### Low-Cost Carriers
- **Ryanair (FR)**
- **EasyJet (U2)**
- **WizzAir (W6)**
- **Norwegian (DY)**
- **Vueling (VY)**
- **Transavia (TO)**
- **Southwest Airlines (WN)**
- **JetBlue (B6)**
- **Spirit Airlines (NK)**
- **Frontier Airlines (F9)**

#### Compagnies Asiatiques
- **Singapore Airlines (SQ)**
- **Cathay Pacific (CX)**
- **Japan Airlines (JL)**
- **All Nippon Airways (NH)**
- **Thai Airways (TG)**
- **Korean Air (KE)**
- **China Eastern (MU)**
- **Air China (CA)**
- **Etihad Airways (EY)**

#### Compagnies du Moyen-Orient
- **Emirates (EK)**
- **Qatar Airways (QR)**
- **Etihad Airways (EY)**
- **Saudi Arabian Airlines (SV)**
- **Kuwait Airways (KU)**
- **Oman Air (WY)**
- **Gulf Air (GF)**

### Classes de Voyage Disponibles

- ✅ **Économique** (ECONOMY)
- ✅ **Économique Premium** (PREMIUM_ECONOMY)
- ✅ **Classe Affaires** (BUSINESS)
- ✅ **Première Classe** (FIRST)

### Types de Vols Supportés

- ✅ **Aller simple**
- ✅ **Aller-retour**
- ✅ **Multi-villes** (via l'API)
- ✅ **Vols directs**
- ✅ **Vols avec escales** (1, 2, ou plus)

### Fonctionnalités de Recherche

1. **Recherche par code IATA** : Recherchez avec les codes d'aéroport (ex: CDG, JFK, ABJ)
2. **Filtrage avancé** :
   - Par compagnie aérienne
   - Par nombre d'escales
   - Par classe de voyage
   - Par fourchette de prix
   - Par horaires de départ/arrivée
3. **Tri des résultats** :
   - Prix le plus bas
   - Vol le plus rapide
   - Départ le plus tôt
   - Départ le plus tard
4. **Informations détaillées** :
   - Durée totale du vol
   - Horaires précis de départ/arrivée
   - Aéroports d'escale
   - Prix par passager
   - Classe de cabine

### Couverture Géographique

- 🌍 **Afrique** : Tous les aéroports internationaux et la plupart des aéroports régionaux
- 🌍 **Europe** : Couverture complète de tous les aéroports
- 🌍 **Amérique du Nord** : États-Unis, Canada, Mexique
- 🌍 **Amérique du Sud** : Tous les pays
- 🌍 **Asie** : Couverture complète
- 🌍 **Océanie** : Australie, Nouvelle-Zélande, îles du Pacifique
- 🌍 **Moyen-Orient** : Tous les pays

### Avantages de l'API Amadeus

1. **Données en temps réel** : Prix et disponibilités actualisés
2. **Tarifs négociés** : Accès aux tarifs spéciaux des compagnies
3. **Consolidateurs** : Incluant des tarifs non disponibles au public
4. **Fiabilité** : Infrastructure utilisée par des milliers d'agences de voyage
5. **Support multi-devises** : Conversion automatique en FCFA
6. **Règles tarifaires** : Conditions d'annulation, bagages, etc.

### Limitations Connues

- ⚠️ Certaines compagnies low-cost peuvent nécessiter une réservation directe
- ⚠️ Les tarifs très promotionnels peuvent ne pas être disponibles via l'API
- ⚠️ Délai de mise à jour : ~2 minutes pour les nouvelles offres

### Maintenance et Mises à Jour

L'API Amadeus est automatiquement mise à jour par le fournisseur avec :
- Nouvelles compagnies aériennes
- Nouvelles routes
- Nouveaux tarifs
- Mises à jour des horaires

Aucune action manuelle n'est nécessaire pour maintenir la base de données à jour.

---

**Dernière mise à jour** : 29 Octobre 2025
**Version API** : Amadeus Flight Offers Search v2
