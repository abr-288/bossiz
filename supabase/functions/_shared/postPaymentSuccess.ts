// Logique post-paiement commune à tous les prestataires (CinetPay, Jèko, ...).
// Extraite de payment-callback/index.ts pour être réutilisée telle quelle par
// jeko-webhook/index.ts — un paiement confirmé déclenche exactement les mêmes
// actions métier quel que soit le gateway qui l'a confirmé.
//
// Ne fait AUCUN appel réseau vers le prestataire de paiement : l'appelant a
// déjà vérifié que le paiement est bien accepté avant d'invoquer cette
// fonction (vérification de statut CinetPay, ou signature webhook Jèko).

import { scheduleAgencyPayout } from "./agencyPayouts.ts";

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

export interface HandlePaymentSuccessParams {
  supabase: SupabaseClient;
  supabaseUrl: string;
  supabaseServiceKey: string;
  transactionId: string;
  bookingId: string | null;
  subscriptionId: string | null;
  carPartnerSubscriptionId?: string | null;
  agencyBrandingSubscriptionId?: string | null;
  paymentMethod: string;
  paymentProvider?: "jeko" | "cinetpay";
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
    carPartnerSubscriptionId,
    agencyBrandingSubscriptionId,
    paymentMethod,
    paymentProvider,
    legacySubscriptionRequestId,
    legacyPlanId,
    legacyPlanName,
  } = params;

  if (carPartnerSubscriptionId) {
    const now = new Date();
    const { data: pendingSubscription, error: lookupError } = await supabase
      .from("car_partner_subscriptions")
      .select("id, agency_id, plan_id, billing_cycle")
      .eq("id", carPartnerSubscriptionId)
      .eq("status", "processing")
      .maybeSingle();
    if (lookupError || !pendingSubscription) {
      const { data: completedSubscription } = await supabase
        .from("car_partner_subscriptions")
        .select("status, transaction_id")
        .eq("id", carPartnerSubscriptionId)
        .maybeSingle();
      if (completedSubscription?.status === "active" && completedSubscription.transaction_id === transactionId) {
        return;
      }
      console.error("Car partner subscription was not in a payable state");
      throw new Error("Car partner subscription was not in a payable state");
    }

    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + (pendingSubscription.billing_cycle === "yearly" ? 365 : 30));
    const { data: subscription, error } = await supabase
      .from("car_partner_subscriptions")
      .update({
        status: "active",
        paid_at: now.toISOString(),
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        transaction_id: transactionId,
        updated_at: now.toISOString(),
      })
      .eq("id", carPartnerSubscriptionId)
      .eq("status", "processing")
      .select("id, agency_id, plan_id, billing_cycle")
      .maybeSingle();

    if (error || !subscription) {
      console.error("Car partner subscription activation failed");
      throw new Error("Car partner subscription activation failed");
    }

    const { error: agencyUpdateError } = await supabase
      .from("agencies")
      .update({ car_plan_id: subscription.plan_id, car_plan_started_at: now.toISOString() })
      .eq("id", subscription.agency_id);
    if (agencyUpdateError) console.error("Car partner plan agency sync failed");
  } else if (agencyBrandingSubscriptionId) {
    const now = new Date();
    const { data: pendingSubscription, error: lookupError } = await supabase
      .from("agency_branding_subscriptions")
      .select("id, agency_id")
      .eq("id", agencyBrandingSubscriptionId)
      .eq("status", "processing")
      .maybeSingle();

    if (lookupError || !pendingSubscription) {
      const { data: completedSubscription } = await supabase
        .from("agency_branding_subscriptions")
        .select("status, transaction_id, agency_id")
        .eq("id", agencyBrandingSubscriptionId)
        .maybeSingle();
      if (completedSubscription?.status === "active" && completedSubscription.transaction_id === transactionId) {
        const { error: agencyUpdateError } = await supabase
          .from("agencies")
          .update({ is_visible: true })
          .eq("id", completedSubscription.agency_id);
        if (agencyUpdateError) {
          console.error("Agency branding activation retry failed");
          throw new Error("Agency branding activation retry failed");
        }
        return;
      }
      console.error("Agency branding subscription was not in a payable state");
      throw new Error("Agency branding subscription was not in a payable state");
    }

    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + 30);
    const { data: subscription, error } = await supabase
      .from("agency_branding_subscriptions")
      .update({
        status: "active",
        paid_at: now.toISOString(),
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        transaction_id: transactionId,
        updated_at: now.toISOString(),
      })
      .eq("id", agencyBrandingSubscriptionId)
      .eq("status", "processing")
      .select("id, agency_id")
      .maybeSingle();

    if (error || !subscription) {
      console.error("Agency branding subscription activation failed");
      throw new Error("Agency branding subscription activation failed");
    }

    const { error: agencyUpdateError } = await supabase
      .from("agencies")
      .update({ is_visible: true })
      .eq("id", subscription.agency_id);
    if (agencyUpdateError) {
      console.error("Agency branding activation failed");
      throw new Error("Agency branding activation failed");
    }
  } else if (subscriptionId) {
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
      .select('id, total_price, amount_due_now, balance_due, payment_plan, currency, services(type, agency_id)')
      .eq('id', bookingId)
      .single();

    const isFlight = bookingRow?.services?.type === 'flight';

    const isDeposit = bookingRow?.payment_plan === 'deposit' && Number(bookingRow?.balance_due || 0) > 0;
    const amountPaid = Number(bookingRow?.amount_due_now || bookingRow?.total_price || 0);
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        payment_status: isDeposit ? 'partially_paid' : 'paid',
        amount_paid: amountPaid,
        balance_due: Math.max(0, Number(bookingRow?.total_price || 0) - amountPaid),
        status: isFlight ? 'pending' : 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (bookingError) {
      console.error('❌ Erreur mise à jour réservation:', bookingError.message);
    } else {
      console.log(isFlight ? '✅ Paiement confirmé - PNR en attente' : '✅ Réservation confirmée');
    }

    // La part agence est 90% du prix en ligne ; les 10% restants reviennent à Bossiz.
    // Les transferts automatiques sont déclenchés uniquement pour l'argent encaissé
    // dans le portefeuille Jèko, pas pour CinetPay ni les paiements en personne.
    const agencyId = bookingRow?.services?.agency_id;
    if (agencyId && bookingRow?.total_price != null) {
      console.log('   - Calcul de la part agence...');
      const commissionRate = 90;
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
      }

      if (paymentProvider === 'jeko') {
        await scheduleAgencyPayout({ supabase, supabaseUrl, supabaseServiceKey, bookingId });
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
