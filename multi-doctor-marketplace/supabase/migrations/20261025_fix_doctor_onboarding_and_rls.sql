-- =========================================================================
-- Asnanji Dental Marketplace — Migration 20261025
-- Fix Doctor Onboarding CHECK Constraint, User Trigger & RLS Hardening
-- =========================================================================

-- 1. FIX PROFILES ROLE CHECK CONSTRAINT
-- Allows 'pending_doctor' and 'assistant' roles without HTTP 500 rejection
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('patient', 'doctor', 'admin', 'pending_doctor', 'assistant'));

-- 2. HARDEN TRIGGER ON NEW AUTH USER REGISTRATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role text;
  user_full_name text;
  user_phone text;
BEGIN
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'patient');
  user_full_name := COALESCE(new.raw_user_meta_data->>'full_name', '');
  user_phone := COALESCE(new.raw_user_meta_data->>'phone', '');

  -- Safeguard: fallback to patient if invalid
  IF user_role NOT IN ('patient', 'doctor', 'admin', 'pending_doctor', 'assistant') THEN
    user_role := 'patient';
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
  VALUES (new.id, user_full_name, user_phone, user_role, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      role = EXCLUDED.role,
      updated_at = NOW();

  RETURN new;
END;
$$;

-- Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. STORAGE & APPOINTMENTS POLICIES
-- Ensure appointments can be read by patient who booked them or assigned doctor
ALTER TABLE IF EXISTS public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients and Doctors can access own appointments" ON public.appointments;
CREATE POLICY "Patients and Doctors can access own appointments"
  ON public.appointments FOR ALL
  TO authenticated
  USING (
    patient_id = auth.uid() OR doctor_id = auth.uid()
  )
  WITH CHECK (
    patient_id = auth.uid() OR doctor_id = auth.uid()
  );

-- 4. CONFIRMATION MESSAGE
SELECT 'Asnanji Migration 20261025 Applied Successfully' AS status;
