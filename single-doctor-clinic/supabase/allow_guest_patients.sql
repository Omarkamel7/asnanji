-- =======================================================
-- FIX GUEST PATIENT MESSAGING & CONSULTATION FLOW
-- =======================================================
-- This script removes the strict auth.users foreign key
-- from public.profiles so that guest patients can submit
-- consultations and chat without needing to create an account first.
-- =======================================================

-- 1. Drop foreign key from profiles to auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Drop foreign key from messages to profiles (if exists)
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- 3. Ensure consultations table has patient info default fallback
ALTER TABLE public.consultations ALTER COLUMN patient_id DROP NOT NULL;

-- 4. Verify Doctor Account Role
UPDATE public.profiles
SET role = 'doctor', full_name = 'د. كريم أبو بكر'
WHERE id = 'ef3bf898-fbae-48ea-94d1-df36277d1b22';
