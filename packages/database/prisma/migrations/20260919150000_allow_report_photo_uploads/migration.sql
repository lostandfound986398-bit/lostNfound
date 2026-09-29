BEGIN;

-- The browser has no SELECT grant on users. Expose only the current caller's
-- account eligibility, never the user table itself.
CREATE FUNCTION public.can_upload_report_photo()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid()) AND status = 'ACTIVE'
  );
$$;
REVOKE ALL ON FUNCTION public.can_upload_report_photo() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_upload_report_photo() TO authenticated;

-- New uploads only: clients cannot overwrite or delete other people's photos.
-- Public retrieval is provided by the public bucket, not table SELECT grants.
CREATE POLICY "Active members can upload report photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'report-photos'
  AND owner_id = (SELECT auth.uid())::text
  AND (SELECT public.can_upload_report_photo())
);

-- proof-files remains private with no browser policies until a proof-upload
-- workflow is implemented. Server-side service-role access remains available.
COMMIT;
