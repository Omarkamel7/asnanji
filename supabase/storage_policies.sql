-- Drop the overly permissive upload policy
DROP POLICY IF EXISTS "Allow all to upload dental media" ON storage.objects;

-- Re-enable open select just in case
DROP POLICY IF EXISTS "Allow all to view dental media" ON storage.objects;
CREATE POLICY "Allow all to view dental media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'dental-media');

-- Allow patients to upload consultation media (assuming patient media goes to 'consultations/')
CREATE POLICY "Patients can upload consultation media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'dental-media' AND (storage.foldername(name))[1] = 'consultations');

-- Allow doctors to manage their own folder (dental-media/doctors/{doctor_id}/*)
CREATE POLICY "Doctors can manage their own folders"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'dental-media' AND (storage.foldername(name))[1] = 'doctors' AND (storage.foldername(name))[2] = auth.uid()::text)
  WITH CHECK (bucket_id = 'dental-media' AND (storage.foldername(name))[1] = 'doctors' AND (storage.foldername(name))[2] = auth.uid()::text);
