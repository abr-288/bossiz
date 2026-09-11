import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// EDGE FUNCTION: upload-driver-document
// Uploads a driver's license photo (front/back) or an applicant photo to
// the private "driver-documents" bucket, ahead of a car booking (see
// CarBookingDialog.tsx). Unlike upload-site-asset (admin/sub_agency only,
// public bucket - marketing photos), this is open to any authenticated
// customer and never returns a public URL: the bucket has no public
// access, only the uploader and admins can read a file (see RLS in
// 20260910150000_create_driver_documents_bucket.sql).
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SIGNED_URL_TTL_SECONDS = 3600; // preview only - the persisted value is the storage path, not this URL
const ALLOWED_DOC_TYPES = new Set(["license_front", "license_back", "applicant_photo"]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Any authenticated user may upload their own documents - no role
    // check, this is the customer-facing booking flow, not an admin tool.
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Non authentifié" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const docTypeRaw = formData.get("docType") as string | null;
    const docType = docTypeRaw && ALLOWED_DOC_TYPES.has(docTypeRaw) ? docTypeRaw : "document";

    if (!file) {
      return new Response(
        JSON.stringify({ error: "Aucun fichier fourni" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Fichier trop volumineux (max 5 Mo)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!file.type.startsWith("image/")) {
      return new Response(
        JSON.stringify({ error: "Format invalide - Images uniquement" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Path is always "<user_id>/..." - built here from the authenticated
    // user, never from client input - this is exactly what the RLS
    // policies on storage.objects check against.
    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `${user.id}/${docType}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { error: uploadError } = await adminClient.storage
      .from("driver-documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      return new Response(
        JSON.stringify({ error: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Short-lived signed URL for the form's own preview only - never
    // stored. What gets persisted on the booking is `path`.
    const { data: signedData, error: signedError } = await adminClient.storage
      .from("driver-documents")
      .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);

    if (signedError) {
      console.error("Signed URL error:", signedError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        path: filePath,
        previewUrl: signedData?.signedUrl || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
