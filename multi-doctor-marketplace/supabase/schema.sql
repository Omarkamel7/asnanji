-- ==============================================================================
-- ?? ASNANJI (ÇÓäÇäÌí) - Multi-Doctor Healthcare Marketplace Schema
-- ==============================================================================

-- 1. Profiles Table (Base users: Patients & Doctors)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
  gender TEXT,
  medical_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Doctor Profiles Table (Marketplace Extended Profiles)
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE,
  specialty TEXT,
  bio TEXT,
  clinic_address TEXT,
  consultation_fee NUMERIC DEFAULT 0,
  avatar_url TEXT,
  is_accepting_patients BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Doctor Settings Table
CREATE TABLE IF NOT EXISTS public.doctor_settings (
  doctor_id UUID PRIMARY KEY REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  working_days JSONB DEFAULT '["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]'::jsonb,
  time_slots JSONB DEFAULT '["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]'::jsonb,
  slot_duration_minutes INT DEFAULT 30,
  enable_instant_consultation BOOLEAN DEFAULT true,
  enable_booking BOOLEAN DEFAULT true,
  enable_chat BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Doctor Portfolio Table (Before & After Cases)
CREATE TABLE IF NOT EXISTS public.doctor_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  before_image_url TEXT NOT NULL,
  after_image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Consultations Table
CREATE TABLE IF NOT EXISTS public.consultations (
  id TEXT PRIMARY KEY,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE SET NULL,
  affected_teeth JSONB DEFAULT '[]'::jsonb,
  symptoms JSONB DEFAULT '[]'::jsonb,
  pain_level INT DEFAULT 5,
  description TEXT,
  image_urls JSONB DEFAULT '[]'::jsonb,
  medical_alerts JSONB DEFAULT '[]'::jsonb,
  urgency_level TEXT DEFAULT 'routine',
  status TEXT DEFAULT 'pending',
  diagnosis_text TEXT,
  first_aid_instructions TEXT,
  recommended_medications TEXT,
  suggested_service_id TEXT,
  diagnosed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  consultation_id TEXT REFERENCES public.consultations(id) ON DELETE SET NULL,
  service_id TEXT,
  service_name TEXT,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  price INT DEFAULT 0,
  status TEXT DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_doctor_appointment UNIQUE (doctor_id, appointment_date, time_slot)
);

-- 7. Doctor Reviews Table (Verified Reviews)
CREATE TABLE IF NOT EXISTS public.doctor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id TEXT UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Messages Table (Real-time Chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id TEXT REFERENCES public.consultations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE SET NULL,
  sender_role TEXT DEFAULT 'patient',
  sender_name TEXT,
  text TEXT,
  image_url TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Doctor Profiles & Settings & Portfolio (Public Read, Doctor Write)
CREATE POLICY "Public read doctor_profiles" ON public.doctor_profiles FOR SELECT USING (true);
CREATE POLICY "Doctor manage doctor_profiles" ON public.doctor_profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Public read doctor_settings" ON public.doctor_settings FOR SELECT USING (true);
CREATE POLICY "Doctor manage doctor_settings" ON public.doctor_settings FOR ALL USING (auth.uid() = doctor_id);

CREATE POLICY "Public read doctor_portfolio" ON public.doctor_portfolio FOR SELECT USING (true);
CREATE POLICY "Doctor manage doctor_portfolio" ON public.doctor_portfolio FOR ALL USING (auth.uid() = doctor_id);

-- Consultations
CREATE POLICY "Users view relevant consultations" ON public.consultations FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
CREATE POLICY "Patients create consultations" ON public.consultations FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Doctors/Patients update consultations" ON public.consultations FOR UPDATE USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- Appointments
CREATE POLICY "Users view relevant appointments" ON public.appointments FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
CREATE POLICY "Patients create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users update appointments" ON public.appointments FOR UPDATE USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- Reviews
CREATE POLICY "Public read reviews" ON public.doctor_reviews FOR SELECT USING (true);
CREATE POLICY "Patients submit reviews" ON public.doctor_reviews FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Messages
CREATE POLICY "Participants read messages" ON public.messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = doctor_id OR
  EXISTS (SELECT 1 FROM public.consultations c WHERE c.id = messages.consultation_id AND c.patient_id = auth.uid())
);
CREATE POLICY "Authenticated send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON public.consultations(doctor_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_consultation ON public.messages(consultation_id, created_at);
