CREATE POLICY "Nurses can update their own clinical photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'clinical-photos' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'clinical-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;