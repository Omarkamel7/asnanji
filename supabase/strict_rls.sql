-- ============================================
-- STRICT Row Level Security Policies
-- Smart Dental Clinic v2.0
-- ============================================
-- WARNING: Run this ONLY after ensuring all patients
-- are registered via Supabase Auth.
-- ============================================

-- Helper function to check if current user is a doctor
CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'doctor'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================
-- PROFILES
-- =====================
DROP POLICY IF EXISTS "Allow all to view profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all to update profiles" ON profiles;

CREATE POLICY "Users view own profile or doctor views all"
  ON profiles FOR SELECT USING (
    id = auth.uid() OR is_doctor()
  );

CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT WITH CHECK (
    id = auth.uid()
  );

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE USING (
    id = auth.uid()
  );

-- =====================
-- CONSULTATIONS
-- =====================
DROP POLICY IF EXISTS "Allow all to view consultations" ON consultations;
DROP POLICY IF EXISTS "Allow all to insert consultations" ON consultations;
DROP POLICY IF EXISTS "Allow all to update consultations" ON consultations;

CREATE POLICY "Patient sees own consultations, doctor sees all"
  ON consultations FOR SELECT USING (
    patient_id = auth.uid() OR is_doctor()
  );

CREATE POLICY "Patients create own consultations"
  ON consultations FOR INSERT WITH CHECK (
    patient_id = auth.uid()
  );

CREATE POLICY "Doctor updates any consultation"
  ON consultations FOR UPDATE USING (
    is_doctor()
  );

-- =====================
-- APPOINTMENTS
-- =====================
DROP POLICY IF EXISTS "Allow all to view appointments" ON appointments;
DROP POLICY IF EXISTS "Allow all to insert appointments" ON appointments;
DROP POLICY IF EXISTS "Allow all to update appointments" ON appointments;

CREATE POLICY "Patient sees own appointments, doctor sees all"
  ON appointments FOR SELECT USING (
    patient_id = auth.uid() OR is_doctor()
  );

CREATE POLICY "Patients create own appointments"
  ON appointments FOR INSERT WITH CHECK (
    patient_id = auth.uid()
  );

CREATE POLICY "Doctor or patient updates appointment"
  ON appointments FOR UPDATE USING (
    patient_id = auth.uid() OR is_doctor()
  );

-- =====================
-- MESSAGES
-- =====================
DROP POLICY IF EXISTS "Allow all to view messages" ON messages;
DROP POLICY IF EXISTS "Allow all to insert messages" ON messages;

CREATE POLICY "Chat participants see messages"
  ON messages FOR SELECT USING (
    sender_id = auth.uid()
    OR is_doctor()
    OR EXISTS (
      SELECT 1 FROM consultations c
      WHERE c.id = messages.consultation_id
      AND c.patient_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users send messages"
  ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid()
  );

-- =====================
-- CLINIC SETTINGS (public read, doctor write)
-- =====================
DROP POLICY IF EXISTS "Allow all to view clinic settings" ON clinic_settings;
DROP POLICY IF EXISTS "Allow all to manage clinic settings" ON clinic_settings;

CREATE POLICY "Anyone can view clinic settings"
  ON clinic_settings FOR SELECT USING (true);

CREATE POLICY "Doctor manages clinic settings"
  ON clinic_settings FOR ALL USING (is_doctor()) WITH CHECK (is_doctor());

-- =====================
-- SERVICES (public read, doctor write)
-- =====================
DROP POLICY IF EXISTS "Allow all to view services" ON services;
DROP POLICY IF EXISTS "Allow all to manage services" ON services;

CREATE POLICY "Anyone can view services"
  ON services FOR SELECT USING (true);

CREATE POLICY "Doctor manages services"
  ON services FOR ALL USING (is_doctor()) WITH CHECK (is_doctor());

-- =====================
-- PORTFOLIO CASES (public read, doctor write)
-- =====================
DROP POLICY IF EXISTS "Allow all to view portfolio cases" ON portfolio_cases;
DROP POLICY IF EXISTS "Allow all to manage portfolio cases" ON portfolio_cases;

CREATE POLICY "Anyone can view portfolio"
  ON portfolio_cases FOR SELECT USING (true);

CREATE POLICY "Doctor manages portfolio"
  ON portfolio_cases FOR ALL USING (is_doctor()) WITH CHECK (is_doctor());
