import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getClientIP, checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";
import { getActivePaymentProvider, getCinetPayCredentials } from "../_shared/integrations.ts";
import { getJekoCredentials, createJekoPaymentLink } from "../_shared/jeko.ts";

// ============================================================
// EDGE FUNCTION: process-payment
// Description: Initie un paiement via le prestataire actif (CinetPay ou
// Jèko, voir /admin/integrations - catégorie "payment")
// Auteur: B-Reserve
// Version: 2.1.0 - Multi-prestataire
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Fonction utilitaire pour créer une réponse JSON
function jsonResponse(data: object, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Fonction utilitaire pour créer une réponse d'erreur
function errorResponse(message: string, status: number = 400, details?: string): Response {
  console.error(`❌ Error [${status}]: ${message}`);
  if (details) {
    console.error(`   Details: ${details}`);
  }
  return jsonResponse({
    success: false,
    error: message,
    code: status,
  }, status);
}

// Taux de conversion vers XOF (alignés sur src/utils/currencyConverter.ts)
// pour ne jamais dépendre du montant fourni par le client.
const EXCHANGE_RATES_TO_XOF: Record<string, number> = {
  XOF: 1,
  FCFA: 1,
  EUR: 655.957,
  USD: 602.123,
  GBP: 785.234,
  CHF: 703.891,
};

// Calcule le montant XOF réellement dû à partir d'une source de vérité serveur
// (bookings.total_price ou user_subscriptions.amount_paid), jamais depuis le body client.
function computeAuthoritativeAmount(amount: unknown, currency: unknown): { valid: boolean; value: number; error?: string } {
  const numAmount = Number(amount);

  if (amount === undefined || amount === null || isNaN(numAmount) || numAmount <= 0) {
    return { valid: false, value: 0, error: "Montant enregistré invalide pour cette cible de paiement" };
  }

  const currencyCode = (typeof currency === 'string' ? currency : 'XOF').toUpperCase();
  const rate = EXCHANGE_RATES_TO_XOF[currencyCode];

  if (!rate) {
    return { valid: false, value: 0, error: `Devise non prise en charge pour le paiement: ${currencyCode}` };
  }

  const xofAmount = Math.round(numAmount * rate);

  if (xofAmount > 10000000) {
    return { valid: false, value: 0, error: "Le montant dépasse le maximum autorisé (10,000,000 XOF)" };
  }

  return { valid: true, value: xofAmount };
}

// Nettoyage et formatage du numéro de téléphone
function formatPhoneNumber(phone: string | undefined | null): string {
  if (!phone) return '';
  
  // Supprimer tous les caractères non numériques sauf +
  let cleaned = phone.toString().replace(/[^\d+]/g, '');
  
  // Supprimer le + au début si présent
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // Ajouter le préfixe Côte d'Ivoire si nécessaire
  if (cleaned.startsWith('0')) {
    cleaned = '225' + cleaned.substring(1);
  } else if (!cleaned.startsWith('225') && cleaned.length <= 10) {
    cleaned = '225' + cleaned;
  }
  
  return cleaned;
}

// Nettoyage des chaînes
function sanitizeString(input: string | undefined | null, maxLength: number = 100): string {
  if (!input) return '';
  return input.toString().trim().substring(0, maxLength);
}

// Génération d'un ID de transaction unique
function generateTransactionId(targetId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${targetId.substring(0, 8)}-${timestamp}-${random}`;
}

serve(async (req) => {
  // Gestion des requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const rateLimitResult = checkRateLimit(clientIP, { ...RATE_LIMITS.PAYMENT, keyPrefix: 'process-payment' });
  if (!rateLimitResult.allowed) {
    console.log(`Rate limit exceeded for IP: ${clientIP.substring(0, 8)}...`);
    return createRateLimitResponse(rateLimitResult, RATE_LIMITS.PAYMENT, corsHeaders);
  }

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║            PROCESS PAYMENT - CINETPAY                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);

  try {
    // ================================================================
    // ÉTAPE 1: Vérification de l'authentification
    // ================================================================
    console.log('\n📋 Étape 1: Vérification de l\'authentification...');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Header d\'autorisation manquant', 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Configuration Supabase manquante');
      return errorResponse('Configuration serveur incomplète', 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Client service_role : nécessaire pour lire integration_credentials
    // (RLS admin-only) - un client authentifié avec le JWT du client final
    // n'a jamais accès à cette table, quel que soit son rôle.
    const adminSupabase = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Authentification échouée:', userError?.message || 'Utilisateur non trouvé');
      return errorResponse('Non autorisé - Veuillez vous connecter', 401);
    }
    
    console.log('✅ Utilisateur authentifié');

    // ================================================================
    // ÉTAPE 2: Parsing et validation du body
    // ================================================================
    console.log('\n📋 Étape 2: Validation des données de paiement...');
    
    let body: any;
    try {
      body = await req.json();
    } catch (parseError) {
      return errorResponse('Corps de la requête invalide - JSON attendu', 400);
    }
    
    console.log('   - bookingId:', body.bookingId ? '✓' : '✗');
    console.log('   - subscriptionId:', body.subscriptionId ? '✓' : '✗');
    console.log('   - paymentMethod:', body.paymentMethod);
    console.log('   - customerInfo:', body.customerInfo ? '✓' : '✗');

    const hasBooking = typeof body.bookingId === 'string' && body.bookingId.length > 0;
    const hasSubscription = typeof body.subscriptionId === 'string' && body.subscriptionId.length > 0;

    if (hasBooking === hasSubscription) {
      return errorResponse('Fournir exactement une cible de paiement: bookingId ou subscriptionId', 400);
    }

    // Validation des infos client
    if (!body.customerInfo || typeof body.customerInfo !== 'object') {
      return errorResponse('Informations client manquantes', 400);
    }

    const customerEmail = sanitizeString(body.customerInfo.email, 255);
    const customerName = sanitizeString(body.customerInfo.name, 100);
    const customerPhone = formatPhoneNumber(body.customerInfo.phone);

    if (!customerEmail || !customerEmail.includes('@')) {
      return errorResponse('Email client invalide', 400);
    }

    if (!customerName || customerName.length < 2) {
      return errorResponse('Nom client invalide (minimum 2 caractères)', 400);
    }

    console.log('✅ Données validées');

    // ================================================================
    // ÉTAPE 2bis: Résolution de la cible et du montant côté serveur
    // ================================================================
    // Le montant et la devise ne sont JAMAIS pris depuis le body du client :
    // ils sont relus depuis la base pour empêcher toute falsification du prix.
    console.log('\n📋 Étape 2bis: Résolution de la cible de paiement...');

    let targetId: string;
    let targetType: 'booking' | 'subscription';
    let sourceAmount: number;
    let sourceCurrency: string;
    let paymentDescription: string;

    if (hasBooking) {
      targetType = 'booking';
      targetId = body.bookingId;

      // Scoped to the caller's own JWT (not adminSupabase): RLS on `bookings`
      // is what actually enforces who may pay here - the booking's own
      // owner, or a company billing admin for a booking billed to their
      // company (see migration 20260910230000_create_companies.sql). No
      // .eq('user_id', ...) filter is added on top - if RLS doesn't expose
      // the row to this caller, .single() below simply finds nothing.
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, user_id, company_id, total_price, currency, payment_status, approval_status')
        .eq('id', targetId)
        .single();

      if (bookingError || !booking) {
        console.error('❌ Réservation introuvable ou non autorisée:', bookingError?.message);
        return errorResponse('Réservation introuvable', 404);
      }

      if (booking.payment_status === 'paid') {
        return errorResponse('Cette réservation a déjà été payée', 409);
      }

      // Company-billed bookings must clear the approval workflow before
      // the DAF/admin can pay them - a booking still 'pending_approval' or
      // explicitly 'rejected' is not payable yet, regardless of who's
      // asking.
      if (booking.company_id && booking.approval_status !== 'approved') {
        return errorResponse(
          booking.approval_status === 'rejected'
            ? 'Cette réservation a été rejetée par un approbateur'
            : "Cette réservation est en attente d'approbation",
          409
        );
      }

      sourceAmount = Number(booking.total_price);
      sourceCurrency = booking.currency;
      paymentDescription = `Réservation #${targetId.substring(0, 8)}`;
    } else {
      targetType = 'subscription';
      targetId = body.subscriptionId;

      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('id, user_id, plan_id, amount_paid, currency, status')
        .eq('id', targetId)
        .eq('user_id', user.id)
        .single();

      if (subscriptionError || !subscription) {
        console.error('❌ Abonnement introuvable ou non autorisé:', subscriptionError?.message);
        return errorResponse('Abonnement introuvable', 404);
      }

      if (subscription.status !== 'pending') {
        return errorResponse('Cet abonnement n\'est pas en attente de paiement', 409);
      }

      sourceAmount = Number(subscription.amount_paid);
      sourceCurrency = subscription.currency || 'XOF';
      paymentDescription = `Abonnement ${subscription.plan_id}`;
    }

    const amountValidation = computeAuthoritativeAmount(sourceAmount, sourceCurrency);
    if (!amountValidation.valid) {
      return errorResponse(amountValidation.error!, 400);
    }

    console.log('✅ Cible résolue:', targetType, targetId);
    console.log('   - Montant autoritaire:', amountValidation.value, 'XOF (source:', sourceAmount, sourceCurrency, ')');
    console.log('   - Méthode:', body.paymentMethod);

    // ================================================================
    // ÉTAPE 3: Résolution du prestataire actif + vérification credentials
    // ================================================================
    console.log('\n📋 Étape 3: Résolution du prestataire de paiement actif...');

    const activeProvider = adminSupabase ? await getActivePaymentProvider(adminSupabase) : 'cinetpay';
    console.log('   - Prestataire actif:', activeProvider);

    let jekoCredentials: Awaited<ReturnType<typeof getJekoCredentials>> = null;
    let cinetpayApiKey: string | undefined;
    let cinetpaySiteId: string | undefined;

    if (activeProvider === 'jeko') {
      jekoCredentials = adminSupabase ? await getJekoCredentials(adminSupabase) : null;
      if (!jekoCredentials) {
        console.error('❌ Identifiants Jèko incomplets');
        return errorResponse('Passerelle de paiement Jèko non configurée (voir /admin/integrations)', 500);
      }
      console.log('✅ Credentials Jèko présents');
    } else {
      const cinetpayCredentials = adminSupabase ? await getCinetPayCredentials(adminSupabase) : null;

      if (!cinetpayCredentials) {
        console.error('❌ Identifiants CinetPay manquants (table et secrets)');
        return errorResponse('Passerelle de paiement non configurée', 500);
      }

      cinetpayApiKey = cinetpayCredentials.apiKey;
      cinetpaySiteId = cinetpayCredentials.siteId;
      console.log('✅ Credentials CinetPay présents');
    }

    // ================================================================
    // ÉTAPE 3bis: Réclamation atomique (idempotence côté base de données)
    // ================================================================
    // La relecture de payment_status à l'étape 2bis a une fenêtre de course:
    // deux requêtes concurrentes (double-clic, retry réseau) peuvent toutes
    // deux la passer avant qu'aucune n'ait rien écrit. Cette UPDATE avec
    // condition WHERE est ce qui empêche réellement deux sessions CinetPay
    // distinctes d'être créées pour la même réservation - un seul appelant
    // peut faire passer payment_status de 'pending' à 'processing'.
    if (targetType === 'booking') {
      console.log('\n📋 Étape 3bis: Réclamation atomique du paiement...');

      let claim = await supabase
        .from('bookings')
        .update({ payment_status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', targetId)
        .eq('payment_status', 'pending')
        .select('id')
        .maybeSingle();

      const isStale = (updatedAt: string) => Date.now() - new Date(updatedAt).getTime() > 5 * 60 * 1000;

      if (!claim.data && sourceAmount !== undefined) {
        // Peut-être une tentative précédente abandonnée (onglet fermé,
        // coupure réseau) - on ne la considère récupérable que si elle date
        // de plus de 5 minutes.
        const { data: currentBooking } = await supabase
          .from('bookings')
          .select('payment_status, updated_at')
          .eq('id', targetId)
          .single();

        if (currentBooking?.payment_status === 'processing' && isStale(currentBooking.updated_at)) {
          claim = await supabase
            .from('bookings')
            .update({ payment_status: 'processing', updated_at: new Date().toISOString() })
            .eq('id', targetId)
            .eq('payment_status', 'processing')
            .select('id')
            .maybeSingle();
        }
      }

      if (!claim.data) {
        return errorResponse('Un paiement est déjà en cours pour cette réservation. Veuillez patienter quelques minutes puis réessayer.', 409);
      }

      console.log('✅ Réservation réclamée pour paiement');
    }

    // Si l'appel CinetPay échoue après la réclamation ci-dessus, il faut
    // repasser payment_status à 'pending' pour ne pas bloquer le client sur
    // une réservation coincée en 'processing' indéfiniment.
    const revertClaim = async () => {
      if (targetType !== 'booking') return;
      await supabase
        .from('bookings')
        .update({ payment_status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', targetId)
        .eq('payment_status', 'processing');
    };

    // ================================================================
    // ÉTAPE 4 (Jèko): Création du lien de paiement, si actif
    // ================================================================
    if (activeProvider === 'jeko' && jekoCredentials) {
      console.log('\n📋 Étape 4 (Jèko): Création du lien de paiement...');

      const jekoPaymentMethod = (body.paymentMethod || 'all').toLowerCase();
      const result = await createJekoPaymentLink(jekoCredentials, {
        title: paymentDescription,
        amountXof: amountValidation.value,
      });

      if (!result.ok) {
        console.error('❌ Erreur Jèko:', result.error);
        await revertClaim();
        return errorResponse(result.error || 'La création du paiement a échoué', 502);
      }

      console.log('✅ Lien de paiement Jèko créé:', result.id);

      const { data: jekoPayment, error: jekoPaymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: targetType === 'booking' ? targetId : null,
          subscription_id: targetType === 'subscription' ? targetId : null,
          user_id: user.id,
          ip_address: clientIP,
          amount: amountValidation.value,
          currency: 'XOF',
          payment_method: jekoPaymentMethod,
          payment_provider: 'jeko',
          // Le transaction_id est l'ID du payment_link Jèko lui-même : c'est
          // ce que le webhook renverra dans transactionDetails.paymentLinkId,
          // donc la clé de corrélation la plus simple et la plus fiable.
          transaction_id: result.id,
          status: 'pending',
          payment_data: {
            jeko_payment_link_id: result.id,
            payment_url: result.link,
            created_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (jekoPaymentError) {
        console.error('❌ Erreur d\'enregistrement:', jekoPaymentError.message);
        console.warn('⚠️ Le paiement est créé mais non enregistré localement');
      } else {
        console.log('✅ Paiement enregistré avec succès');
      }

      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║                    ✅ SUCCÈS (Jèko)                          ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('');

      return jsonResponse({
        success: true,
        payment_url: result.link,
        transaction_id: result.id,
        payment_id: jekoPayment?.id || null,
      }, 200);
    }

    // ================================================================
    // ÉTAPE 4: Préparation du payload CinetPay
    // ================================================================
    console.log('\n📋 Étape 4: Préparation du payload CinetPay...');
    
    const transactionId = generateTransactionId(targetId);
    console.log('   - Transaction ID:', transactionId);

    // Déterminer les canaux de paiement
    let channels = 'ALL';
    const paymentMethod = (body.paymentMethod || 'all').toLowerCase();
    
    switch (paymentMethod) {
      case 'card':
        channels = 'CREDIT_CARD';
        break;
      case 'mobile_money':
        channels = 'MOBILE_MONEY';
        break;
      case 'wave':
        channels = 'WALLET';
        break;
      case 'bank_transfer':
        channels = 'ALL';
        break;
      default:
        channels = 'ALL';
    }
    console.log('   - Channels:', channels);

    // Séparer prénom/nom
    const nameParts = customerName.split(' ').filter(p => p.length > 0);
    const firstName = nameParts[0] || 'Client';
    let lastName = nameParts.slice(1).join(' ') || firstName;
    
    // CinetPay requiert un nom de famille d'au moins 2 caractères
    if (lastName.length < 2) {
      lastName = firstName.length >= 2 ? firstName : 'Client';
    }

    // URLs de retour et notification
    const returnUrl = targetType === 'booking'
      ? `https://traversee-connect.lovable.app/confirmation?bookingId=${targetId}`
      : `https://traversee-connect.lovable.app/dashboard?subscription=pending`;
    const notifyUrl = `${supabaseUrl}/functions/v1/payment-callback`;

    console.log('   - Return URL:', returnUrl);
    console.log('   - Notify URL:', notifyUrl);

    const cinetpayPayload = {
      apikey: cinetpayApiKey,
      site_id: cinetpaySiteId,
      transaction_id: transactionId,
      amount: amountValidation.value,
      currency: 'XOF',
      description: paymentDescription,
      customer_name: firstName,
      customer_surname: lastName,
      customer_email: customerEmail,
      customer_phone_number: customerPhone || '225000000000',
      customer_address: sanitizeString(body.customerInfo.address, 255) || 'N/A',
      customer_city: sanitizeString(body.customerInfo.city, 100) || 'Abidjan',
      customer_country: 'CI',
      customer_state: 'CI',
      customer_zip_code: '00225',
      notify_url: notifyUrl,
      return_url: returnUrl,
      channels: channels,
      lang: 'fr',
      metadata: JSON.stringify({
        type: targetType,
        booking_id: targetType === 'booking' ? targetId : undefined,
        subscription_id: targetType === 'subscription' ? targetId : undefined,
        user_id: user.id,
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
      }),
    };

    console.log('✅ Payload préparé');

    // ================================================================
    // ÉTAPE 5: Appel à l'API CinetPay
    // ================================================================
    console.log('\n📋 Étape 5: Appel à l\'API CinetPay...');
    console.log('   - URL: https://api-checkout.cinetpay.com/v2/payment');
    
    let cinetpayResponse: Response;
    let cinetpayData: any;
    
    try {
      cinetpayResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(cinetpayPayload),
      });
      
      console.log('   - HTTP Status:', cinetpayResponse.status);
      
      const responseText = await cinetpayResponse.text();
      
      try {
        cinetpayData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('❌ Réponse CinetPay non-JSON:', responseText.substring(0, 200));
        await revertClaim();
        return errorResponse('Réponse invalide de la passerelle de paiement', 502);
      }

    } catch (fetchError) {
      console.error('❌ Erreur réseau lors de l\'appel CinetPay:', fetchError);
      await revertClaim();
      return errorResponse('Impossible de contacter la passerelle de paiement. Veuillez réessayer.', 503);
    }

    console.log('   - Response Code:', cinetpayData.code);
    console.log('   - Message:', cinetpayData.message || 'N/A');

    // ================================================================
    // ÉTAPE 6: Traitement de la réponse CinetPay
    // ================================================================
    console.log('\n📋 Étape 6: Traitement de la réponse CinetPay...');
    
    // CinetPay retourne '201' pour une création réussie
    if (cinetpayData.code !== '201') {
      console.error('❌ Création du paiement échouée');
      console.error('   - Code:', cinetpayData.code);
      console.error('   - Message:', cinetpayData.message || 'Inconnu');
      console.error('   - Description:', cinetpayData.description || 'N/A');
      
      // Messages d'erreur personnalisés selon le code
      let userMessage = 'La création du paiement a échoué';
      
      if (cinetpayData.code === '401' || cinetpayData.code === '403') {
        userMessage = 'Erreur de configuration de la passerelle de paiement';
      } else if (cinetpayData.code === '422') {
        userMessage = 'Données de paiement invalides';
      } else if (cinetpayData.message) {
        userMessage = cinetpayData.message;
      }

      await revertClaim();
      return errorResponse(userMessage, 400, `CinetPay code: ${cinetpayData.code}`);
    }

    // Vérifier la présence de l'URL de paiement
    if (!cinetpayData.data?.payment_url) {
      console.error('❌ URL de paiement manquante dans la réponse');
      await revertClaim();
      return errorResponse('URL de paiement non reçue. Veuillez réessayer.', 502);
    }

    console.log('✅ Paiement créé avec succès');
    console.log('   - Payment URL:', cinetpayData.data.payment_url.substring(0, 50) + '...');

    // ================================================================
    // ÉTAPE 7: Enregistrement en base de données
    // ================================================================
    console.log('\n📋 Étape 7: Enregistrement du paiement...');
    
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: targetType === 'booking' ? targetId : null,
        subscription_id: targetType === 'subscription' ? targetId : null,
        user_id: user.id,
        ip_address: clientIP,
        amount: amountValidation.value,
        currency: 'XOF',
        payment_method: paymentMethod,
        payment_provider: 'cinetpay',
        transaction_id: transactionId,
        status: 'pending',
        payment_data: {
          transaction_id: transactionId,
          payment_url: cinetpayData.data.payment_url,
          payment_token: cinetpayData.data.payment_token || null,
          channels: channels,
          cinetpay_code: cinetpayData.code,
          created_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (paymentError) {
      console.error('❌ Erreur d\'enregistrement:', paymentError.message);
      // On retourne quand même l'URL car le paiement est créé côté CinetPay
      console.warn('⚠️ Le paiement est créé mais non enregistré localement');
    } else {
      console.log('✅ Paiement enregistré avec succès');
      console.log('   - Payment ID:', payment.id);
    }

    // ================================================================
    // SUCCÈS FINAL
    // ================================================================
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ SUCCÈS                                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    return jsonResponse({
      success: true,
      payment_url: cinetpayData.data.payment_url,
      transaction_id: transactionId,
      payment_id: payment?.id || null,
    }, 200);

  } catch (error) {
    // ================================================================
    // GESTION DES ERREURS NON CATCHÉES
    // ================================================================
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    ❌ ERREUR                                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
    
    console.error('Type:', errorType);
    console.error('Message:', errorMessage);
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
    console.log('');

    return jsonResponse({
      success: false,
      error: 'Une erreur inattendue est survenue lors du traitement du paiement. Veuillez réessayer.',
      code: 500,
    }, 500);
  }
});
