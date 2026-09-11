// Logique post-paiement commune à tous les prestataires (CinetPay, Jèko, ...).
// Extraite de payment-callback/index.ts pour être réutilisée telle quelle par
// jeko-webhook/index.ts — un paiement confirmé déclenche exactement les mêmes
// actions métier quel que soit le gateway qui l'a confirmé.
//
// Ne fait AUCUN appel réseau vers le prestataire de paiement : l'appelant a
// déjà vérifié que le paiement est bien accepté avant d'invoquer cette
// fonction (vérification de statut CinetPay, ou signature webhook Jèko).

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

export interface HandlePaymentSuccessParams {
  supabase: SupabaseClient;
  supabaseUrl: string;
  supabaseServiceKey: string;
  transactionId: string;
  bookingId: string | null;
  subscriptionId: string | null;
  paymentMethod: string;
  legacySubscriptionRequestId?: string | null;
  legacyPlanId?: string;
  legacyPlanName?: string;
}

export async function handlePaymentSuccess(params: HandlePaymentSuccessParams): Promise<void> {
  const {
    supabase,
    supabaseUrl,
    supabaseServiceKey,
    transactionId,
    bookingId,
    subscriptionId,
    paymentMethod,
    legacySubscriptionRequestId,
    legacyPlanId,
    legacyPlanName,
  } = params;

  if (subscriptionId) {
    // Flux réel: activer l'abonnement créé par /subscription-payment
    console.log('   - Traitement abonnement (user_subscriptions)...');

    const now = new Date().toISOString();
    const { data: subscription, error: subscriptionUpdateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        last_payment_date: now,
        updated_at: now,
      })
      .eq('id', subscriptionId)
      .select('id, user_id, plan_id, amount_paid, currency')
      .single();

    if (subscriptionUpdateError) {
      console.error('❌ Erreur activation abonnement:', subscriptionUpdateError.message);
    } else {
      console.log('✅ Abonnement activé:', subscription.id);

      const { data: authUser } = await supabase.auth.admin.getUserById(subscription.user_id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', subscription.user_id)
        .single();

      try {
        console.log('   - Déclenchement email confirmation abonnement...');
        fetch(`${supabaseUrl}/functions/v1/send-subscription-confirmation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            planName: subscription.plan_id,
            planPrice: subscription.amount_paid,
            customerName: profile?.full_name || authUser?.user?.email?.split('@')[0] || 'Client',
            customerEmail: authUser?.user?.email,
            customerPhone: profile?.phone,
            paymentMethod,
            transactionId,
          }),
        }).catch((e: Error) => console.warn('⚠️ Email abonnement non envoyé:', e.message));
      } catch {
        console.warn('⚠️ Erreur déclenchement email abonnement');
      }
    }
  } else if (legacySubscriptionRequestId) {
    // Ancien flux (formulaire de demande d'abonnement sans compte/paiement réel)
    console.log('   - Traitement abonnement (subscription_requests, legacy)...');

    const { data: subscriptionRequest } = await supabase
      .from('subscription_requests')
      .select('*')
      .eq('id', legacySubscriptionRequestId)
      .single();

    if (subscriptionRequest) {
      const { data: planData } = await supabase
        .from('subscription_plans')
        .select('price')
        .eq('plan_id', legacyPlanId)
        .single();

      try {
        console.log('   - Déclenchement email confirmation abonnement...');
        fetch(`${supabaseUrl}/functions/v1/send-subscription-confirmation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            subscriptionRequestId: legacySubscriptionRequestId,
            planName: legacyPlanName,
            planPrice: planData?.price || 'N/A',
            customerName: subscriptionRequest.name,
            customerEmail: subscriptionRequest.email,
            customerPhone: subscriptionRequest.phone,
            paymentMethod,
            transactionId,
          }),
        }).catch((e: Error) => console.warn('⚠️ Email abonnement non envoyé:', e.message));
      } catch {
        console.warn('⚠️ Erreur déclenchement email abonnement');
      }
    }
  } else if (bookingId) {
    // Traitement pour les réservations classiques
    // Les vols ne sont PAS marqués "confirmed" ici : tant que le PNR réel
    // n'a pas été émis par create-pnr, la place n'est pas garantie chez le
    // transporteur. On les laisse en "pending" (payés) et create-pnr, appelé
    // juste après, décide seul de confirmer ou de rembourser automatiquement.
    // Les autres types (hôtel/voiture/...) n'ont pas d'étape de confirmation
    // fournisseur équivalente : ils restent confirmés immédiatement.
    const { data: bookingRow } = await supabase
      .from('bookings')
      .select('id, total_price, currency, services(type, agency_id)')
      .eq('id', bookingId)
      .single();

    const isFlight = bookingRow?.services?.type === 'flight';

    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        status: isFlight ? 'pending' : 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (bookingError) {
      console.error('❌ Erreur mise à jour réservation:', bookingError.message);
    } else {
      console.log(isFlight ? '✅ Paiement confirmé - PNR en attente' : '✅ Réservation confirmée');
    }

    // Commission agence : uniquement si le service réservé appartient à une
    // agence partenaire (agency_id non nul - jamais le cas pour un résultat
    // API tiers ou un service créé à la volée sans partenaire). Le montant
    // n'est JAMAIS repris du booking directement : toujours recalculé ici
    // depuis le taux de commission stocké sur l'agence, pour ne pas dépendre
    // d'une valeur que le client aurait pu influencer.
    // La ligne est créée avec status='pending' - il n'existe pas de délai de
    // reversement automatique : un admin la marque 'paid' manuellement une
    // fois le virement/mobile money réellement effectué (voir /admin/commissions).
    const agencyId = bookingRow?.services?.agency_id;
    if (agencyId && bookingRow?.total_price != null) {
      console.log('   - Calcul de la commission agence...');
      const { data: agency } = await supabase
        .from('agencies')
        .select('commission_rate')
        .eq('id', agencyId)
        .single();

      const commissionRate = Number(agency?.commission_rate ?? 10);
      const bookingAmount = Number(bookingRow.total_price);
      const commissionAmount = Math.round(bookingAmount * (commissionRate / 100));

      const { error: commissionError } = await supabase
        .from('commissions')
        .insert({
          agency_id: agencyId,
          booking_id: bookingId,
          booking_amount: bookingAmount,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
        });

      // UNIQUE(booking_id) on commissions makes this safe to attempt more
      // than once (e.g. a retried webhook) - a duplicate-key error here just
      // means the row already exists, not a real failure.
      if (commissionError && commissionError.code !== '23505') {
        console.error('❌ Erreur création commission:', commissionError.message);
      } else if (!commissionError) {
        console.log(`✅ Commission créée: ${commissionAmount} ${bookingRow.currency || 'XOF'} (${commissionRate}%) pour l'agence ${agencyId}`);
      }
    }

    // Email "réservation confirmée" et facture : pour un vol, différés
    // jusqu'à ce que create-pnr confirme un vrai PNR (voir plus bas).
    if (!isFlight) {
      try {
        console.log('   - Déclenchement email de confirmation...');
        fetch(`${supabaseUrl}/functions/v1/send-booking-confirmation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ bookingId }),
        }).catch((e: Error) => console.warn('⚠️ Email non envoyé:', e.message));
      } catch {
        console.warn('⚠️ Erreur déclenchement email');
      }

      try {
        console.log('   - Déclenchement génération facture...');
        supabase.functions.invoke('generate-invoice', {
          body: { bookingId },
        }).catch(() => console.warn('⚠️ Facture non générée'));
      } catch {
        console.warn('⚠️ Erreur génération facture');
      }
    }

    // Création PNR (async, non bloquant) - create-pnr déclenchera lui-même
    // l'email/la facture une fois le PNR réel confirmé, ou le remboursement
    // automatique en cas d'échec.
    try {
      console.log('   - Déclenchement création PNR...');
      fetch(`${supabaseUrl}/functions/v1/create-pnr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ booking_id: bookingId }),
      }).catch((e: Error) => console.warn('⚠️ PNR non créé'));
    } catch {
      console.warn('⚠️ Erreur création PNR');
    }
  }
}
