// ============================================================
// Shared helper: signed price offers
// A search edge function (search-hotels, car-rental, ...) signs the exact
// price it computed server-side. The booking edge function (create-booking)
// re-verifies that signature before trusting the price, so a client can
// never submit a total_price the server didn't itself produce.
// Uses PRICE_SIGNING_SECRET (dedicated secret), never SUPABASE_SERVICE_ROLE_KEY:
// that key also bypasses RLS on the whole database, so reusing it here would
// mean any leak of the signing secret compromises far more than price integrity.
// ============================================================

export interface SignedOfferPayload {
  service_type: string;
  service_name: string;
  location: string;
  unit_price: number;
  currency: string;
  expires_at: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function getHmacKey(usage: 'sign' | 'verify'): Promise<CryptoKey> {
  const secretKey = Deno.env.get('PRICE_SIGNING_SECRET') || '';
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  );
}

export async function signOffer(payload: SignedOfferPayload): Promise<string> {
  const cryptoKey = await getHmacKey('sign');
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(JSON.stringify(payload)));
  return arrayBufferToBase64(signature);
}

export async function verifyOfferSignature(payload: SignedOfferPayload, signature: string): Promise<boolean> {
  try {
    const cryptoKey = await getHmacKey('verify');
    const encoder = new TextEncoder();
    const signatureBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify('HMAC', cryptoKey, signatureBytes, encoder.encode(JSON.stringify(payload)));
  } catch {
    return false;
  }
}
