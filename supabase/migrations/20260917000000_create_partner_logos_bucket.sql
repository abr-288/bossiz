-- Public storage bucket for logos uploaded from the public "Devenir
-- partenaire" application form (BecomePartner.tsx). The applicant is
-- anonymous (no account yet - see partner_applications RLS), so this
-- bucket is intentionally separate from site-assets (admin/sub_agency
-- only): no RLS INSERT/UPDATE/DELETE policy is granted here at all, so
-- direct client-side writes are always denied regardless of auth state.
-- The only writer is the upload-partner-logo edge function, which uses
-- the service-role key (bypasses RLS) and enforces file type/size limits
-- before ever touching storage.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partner-logos',
  'partner-logos',
  true,
  2097152, -- 2 MB, enforced again in upload-partner-logo as defense in depth
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Public can view partner logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'partner-logos');
