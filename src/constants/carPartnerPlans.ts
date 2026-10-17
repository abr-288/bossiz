// Forfaits voiture payants (Pro, Flotte) suspendus : les loueurs publient
// leurs véhicules gratuitement et sans limite. La base applique la même règle
// (migration 20261017000000_free_car_partner_listings.sql) ; pour réactiver
// les forfaits, repasser ce drapeau à true ET réexécuter les fonctions de
// 20261006130000_paid_car_partner_subscriptions.sql.
export const CAR_PLAN_PAYMENTS_ENABLED = false;
