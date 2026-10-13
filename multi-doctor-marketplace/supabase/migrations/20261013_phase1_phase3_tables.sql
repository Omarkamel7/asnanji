-- ==============================================================================
-- ASNANJI (اسنانجي) - Phase 1 & 3 Database Schema Migrations
-- Adds: doctor_applications, clinic_assistants, prescriptions, dental_records
-- ==============================================================================

-- 1. Extend profiles table with assigned_doctor_id & push_token if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chronic_diseases JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allergies TEXT DEFAULT '';

-- Update profiles role constraint to include 'assistant'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('patient', 'doctor', 'admin', 'assistant'));

-- 2. Doctor Applications Table (Onboarding & Credentialing)
CREATE TABLE IF NOT EXISTS public.doctor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  specialty TEXT NOT NULL,
  degree TEXT DEFAULT 'specialist',
  syndicate_id TEXT,
  clinic_address TEXT NOT NULL,
  governorate TEXT,
  consultation_fee NUMERIC DEFAULT 350,
  license_document_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.doctor_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public apply for doctor onboarding" ON public.doctor_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view all applications" ON public.doctor_applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins update applications" ON public.doctor_applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Clinic Assistants Table (Doctor can manage up to 2 receptionists)
CREATE TABLE IF NOT EXISTS public.clinic_assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  assistant_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_assistant_per_clinic UNIQUE (doctor_id, assistant_user_id)
);

ALTER TABLE public.clinic_assistants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctor view own assistants" ON public.clinic_assistants FOR SELECT USING (
  doctor_id = auth.uid() OR assistant_user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Doctor manage own assistants" ON public.clinic_assistants FOR ALL USING (
  doctor_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Prescriptions Table (Formal Medical Rx Archive)
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id TEXT PRIMARY KEY,
  consultation_id TEXT REFERENCES public.consultations(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  diagnosis_title TEXT NOT NULL,
  medications JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{name, dose, frequency, duration, notes}]
  special_instructions TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patient & Doctor view prescriptions" ON public.prescriptions FOR SELECT USING (
  patient_id = auth.uid() OR doctor_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Doctor creates prescription" ON public.prescriptions FOR INSERT WITH CHECK (
  doctor_id = auth.uid()
);

-- 5. Dental Records & Scans Gallery (X-Rays, Scans & Patient Before/After)
CREATE TABLE IF NOT EXISTS public.patient_dental_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE SET NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('xray', 'panoramic', 'photo', 'before_after')),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  before_image_url TEXT,
  after_image_url TEXT,
  notes TEXT,
  tooth_number INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.patient_dental_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patient views own dental records" ON public.patient_dental_records FOR SELECT USING (
  patient_id = auth.uid() OR doctor_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'doctor' OR role = 'admin'))
);
CREATE POLICY "Doctor inserts dental records" ON public.patient_dental_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'doctor' OR role = 'admin'))
);

-- Indexes for lightning performance
CREATE INDEX IF NOT EXISTS idx_doctor_applications_status ON public.doctor_applications(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON public.prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_dental_records ON public.patient_dental_records(patient_id, record_type);
