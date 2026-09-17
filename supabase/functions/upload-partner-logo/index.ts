import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// EDGE FUNCTION: upload-partner-logo
// Uploads a logo attached to a public "Devenir partenaire" application
// (BecomePartner.tsx) to the public "partner-logos" bucket. Unlike
// upload-site-asset / upload-driver-document, the caller here is a
// prospective partner who has no account yet, so this endpoint is
// intentionally open (anon key only, no user auth check) - the only
// guardrails are the strict type/size checks below plus the bucket's own
// file_size_limit/allowed_mime_types (see the create_partner_logos_bucket
// migration). Never used to overwrite an existing file: the generated
// path always includes a random suffix.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "Aucun fichier fourni" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: "Fichier trop volumineux (max 2 Mo)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extension = ALLOWED_MIME_TYPES[file.type];
    if (!extension) {
      return new Response(
        JSON.stringify({ error: "Format invalide - JPEG, PNG ou WEBP uniquement" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { error: uploadError } = await adminClient.storage
      .from("partner-logos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Partner logo upload error:", uploadError.message);
      return new Response(
        JSON.stringify({ error: "Échec du téléchargement du logo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicUrlData } = adminClient.storage
      .from("partner-logos")
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({ url: publicUrlData.publicUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("upload-partner-logo error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
