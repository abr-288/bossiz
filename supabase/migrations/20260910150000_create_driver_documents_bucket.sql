-- Private storage for the driver's license (front/back) and applicant photo
-- collected in CarBookingDialog before a car booking. These are identity
-- documents, so unlike site-assets/agency-cars (public buckets, used for
-- marketing photos) this bucket is NOT public: only the uploader and admins
-- can read a given file, enforced by RLS on storage.objects.
--
-- Run manually in the Supabase Dashboard SQL Editor (Supabase CLI is broken
-- for this project - see prior migrations). Idempotent - safe to re-run.

INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Files are always stored as "<user_id>/<filename>" (enforced by the
-- upload-driver-document edge function, which builds the path itself from
-- the authenticated user's id - never from client input) so
-- storage.foldername(name)[1] reliably identifies the owner.

DROP POLICY IF EXISTS "Users can upload their own driver documents" ON storage.objects;
CREATE POLICY "Users can upload their own driver documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'driver-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can view their own driver documents" ON storage.objects;
CREATE POLICY "Users can view their own driver documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'driver-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Admins can view all driver documents" ON storage.objects;
CREATE POLICY "Admins can view all driver documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'driver-documents'
    AND has_role(auth.uid(), 'admin')
  );
