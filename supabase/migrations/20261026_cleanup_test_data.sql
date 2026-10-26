-- =========================================================================
-- Asnanji Dental Marketplace — Migration 20261026
-- Complete Production Cleanup: Purge all Mock & Test Data
-- =========================================================================

-- 1. Purge all test chat messages
DELETE FROM public.messages;

-- 2. Purge all test consultations / complaints
DELETE FROM public.consultations;

-- 3. Purge any test appointments
DELETE FROM public.appointments;

-- 4. Purge test doctor-related sub-records
DELETE FROM public.doctor_settings WHERE doctor_id = 'ef3bf898-fbae-48ea-94d1-df36277d1b22';
DELETE FROM public.doctor_portfolio WHERE doctor_id = 'ef3bf898-fbae-48ea-94d1-df36277d1b22';
DELETE FROM public.doctor_assistants WHERE doctor_id = 'ef3bf898-fbae-48ea-94d1-df36277d1b22';
DELETE FROM public.services WHERE doctor_id = 'ef3bf898-fbae-48ea-94d1-df36277d1b22';

-- 5. Delete test doctor profile
DELETE FROM public.doctor_profiles WHERE id = 'ef3bf898-fbae-48ea-94d1-df36277d1b22';

-- 6. Purge test mock user profiles
DELETE FROM public.profiles WHERE id IN (
  'ef3bf898-fbae-48ea-94d1-df36277d1b22', -- Dr. Karim mock doctor
  'eca1274c-fc3d-49c3-8a0f-8150a2ae786f', -- Mock patient Mohamed Ibrahim
  'c761ebaa-0323-430b-a2e0-6ddbd890d5ea', -- Mock patient Mohamed Ahmed
  '00000000-0000-0000-0000-000000000001', -- Test Profile
  '67c64c61-f46d-42ee-a3e6-e70e2060f8c0', -- Gibberish test profile
  '8fcebba2-1676-4cb8-ad64-d82f7dc2df8a'  -- Placeholder profile
);

-- 7. Ensure proper RLS DELETE policies for future management
DROP POLICY IF EXISTS "Admins and Doctors can delete own consultations" ON public.consultations;
CREATE POLICY "Admins and Doctors can delete own consultations"
  ON public.consultations FOR DELETE
  TO authenticated
  USING (
    doctor_id = auth.uid() OR 
    patient_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins and Senders can delete messages" ON public.messages;
CREATE POLICY "Admins and Senders can delete messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (
    sender_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 8. Confirmation of clean database state
SELECT 
  (SELECT COUNT(*) FROM public.messages) AS remaining_messages,
  (SELECT COUNT(*) FROM public.consultations) AS remaining_consultations,
  (SELECT COUNT(*) FROM public.doctor_profiles) AS remaining_doctors,
  (SELECT COUNT(*) FROM public.profiles) AS remaining_profiles;
