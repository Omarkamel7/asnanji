-- ==============================================================================
-- SMART DENTAL CLINIC - COMPLETE BACKEND SCHEMA & MIGRATION SCRIPT
-- ==============================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  role TEXT CHECK (role IN ('patient', 'doctor')) DEFAULT 'patient',
  has_diabetes BOOLEAN DEFAULT false,
  has_hypertension BOOLEAN DEFAULT false,
  has_penicillin_allergy BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Consultations / Complaints Triage Table
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  affected_teeth INTEGER[] DEFAULT '{}',
  symptoms TEXT[] DEFAULT '{}',
  pain_level INTEGER CHECK (pain_level >= 1 AND pain_level <= 10) DEFAULT 5,
  description TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  audio_url TEXT,
  medical_alerts TEXT[] DEFAULT '{}',
  urgency_level TEXT CHECK (urgency_level IN ('emergency', 'urgent', 'moderate', 'routine')) DEFAULT 'moderate',
  status TEXT CHECK (status IN ('pending', 'diagnosed', 'appointment_booked')) DEFAULT 'pending',
  diagnosis_text TEXT,
  first_aid_instructions TEXT,
  recommended_medications TEXT,
  suggested_service_id TEXT,
  diagnosed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  price INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('confirmed', 'cancelled', 'completed')) DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Messages Table (Medical Consultation Chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_role TEXT CHECK (sender_role IN ('patient', 'doctor')) NOT NULL,
  sender_name TEXT NOT NULL,
  text TEXT DEFAULT '',
  image_url TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Clinic Settings Table (Dynamic Doctor & Clinic Info)
CREATE TABLE IF NOT EXISTS public.clinic_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  doctor_name TEXT NOT NULL DEFAULT 'د. كريم أبو بكر',
  doctor_title TEXT NOT NULL DEFAULT 'استشاري طب وجراحة وتجميل وزراعة الأسنان',
  doctor_bio TEXT NOT NULL DEFAULT 'تقديم أحدث الحلول العلاجية والتجميلية وزراعة وتجميل الأسنان بأعلى معايير التعقيم العالمية وأحدث التقنيات الرقمية المتقدمة.',
  avatar_url TEXT DEFAULT '',
  cover_image_url TEXT DEFAULT '',
  years_experience INTEGER DEFAULT 12,
  patients_count INTEGER DEFAULT 3500,
  rating NUMERIC(3,1) DEFAULT 4.9,
  phone_number TEXT NOT NULL DEFAULT '+20 100 000 0000',
  whatsapp_number TEXT NOT NULL DEFAULT '+20 100 000 0000',
  location_address TEXT NOT NULL DEFAULT 'مصر الجديدة - القاهرة',
  location_maps_url TEXT DEFAULT 'https://maps.google.com',
  working_hours TEXT NOT NULL DEFAULT 'السبت - الخميس: 12:00 م - 10:00 م',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Services Table (Dynamic Services & Prices)
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  description_en TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  icon_name TEXT DEFAULT 'Sparkles',
  category TEXT DEFAULT 'restoration',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Portfolio Cases Table (Before & After Transformations)
CREATE TABLE IF NOT EXISTS public.portfolio_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  category_ar TEXT NOT NULL DEFAULT 'تجميل الأسنان',
  category_en TEXT NOT NULL DEFAULT 'Cosmetics',
  description_ar TEXT NOT NULL,
  description_en TEXT NOT NULL,
  before_image_url TEXT NOT NULL,
  after_image_url TEXT NOT NULL,
  duration_weeks INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. Initial Seed Data
-- ==============================================================================

-- Seed Clinic Settings
INSERT INTO public.clinic_settings (
  id, doctor_name, doctor_title, doctor_bio,
  phone_number, whatsapp_number, location_address, working_hours
) VALUES (
  'main',
  'د. كريم أبو بكر',
  'استشاري طب وجراحة وتجميل وزراعة الأسنان',
  'تقديم أحدث الحلول العلاجية والتجميلية وزراعة وتجميل الأسنان بأعلى معايير التعقيم العالمية وأحدث التقنيات الرقمية المتقدمة.',
  '+20 100 000 0000',
  '+20 100 000 0000',
  'مصر الجديدة - القاهرة',
  'السبت - الخميس: 12:00 م - 10:00 م'
) ON CONFLICT (id) DO NOTHING;

-- Seed Default Services
INSERT INTO public.services (id, name_ar, name_en, description_ar, description_en, price, duration_minutes, icon_name, category, sort_order)
VALUES
  ('srv_checkup', 'كشف واستشارة تخصصية', 'Specialist Consultation', 'فحص شامل للأسنان واللثة مع خطة علاجية رقمية متكاملة', 'Comprehensive oral exam and treatment plan', 300, 30, 'Search', 'checkup', 1),
  ('srv_scaling', 'تنظيف وإزالة الجير وتلميع الأسنان', 'Dental Cleaning & Polishing', 'إزالة الترسبات الجيرية بالموجات الصوتية وتلميع الأسنان', 'Ultrasonic tartar removal and airflow polishing', 500, 45, 'Sparkles', 'restoration', 2),
  ('srv_whitening', 'جلسة تبييض الأسنان بالليزر', 'Laser Teeth Whitening', 'تبييض احترافي بالليزر خلال 45 دقيقة بنتائج فورية مذهلة', 'Professional in-office laser whitening session', 1800, 60, 'Sun', 'cosmetics', 3),
  ('srv_veneers', 'ابتسامة هوليوود وعدسات الفينير', 'Hollywood Smile & Veneers', 'عدسات تجميلية فائقة الدقة E-max لابتسامة طبيعية متناسقة', 'Custom ultra-thin E-max porcelain veneers', 3500, 60, 'Smile', 'cosmetics', 4),
  ('srv_implant', 'زراعة الأسنان الفورية الألمانية', 'German Dental Implant', 'زراعة تيتانيوم ألمانية مع التاج بتقنية ثلاثية الأبعاد بدون ألم', 'Titanium implant placement with 3D guided precision', 8500, 60, 'ShieldCheck', 'surgery', 5),
  ('srv_root_canal', 'علاج وجذور وأعصاب الضرس (جلسة واحدة)', 'Endodontic Root Canal Therapy', 'تنظيف وحشو الجذور بأحدث أجهزة الروتاري الإلكترونية', 'Single-visit rotary root canal treatment', 1200, 45, 'Activity', 'endodontics', 6)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Portfolio Cases
INSERT INTO public.portfolio_cases (title_ar, title_en, category_ar, category_en, description_ar, description_en, before_image_url, after_image_url, duration_weeks)
VALUES
  (
    'تصميم ابتسامة هوليوود بالفينير السويسري (10 أسنان)',
    'Hollywood Smile Porcelain Veneers (10 Teeth)',
    'تجميل الأسنان',
    'Cosmetic Dentistry',
    'علاج تصبغات الأسنان وعدم تناسق الحجم بتركيب عدسات E-Max طبيعية المظهر.',
    'Restoration of tooth discoloration and misalignment using custom E-Max veneers.',
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&q=80',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=80',
    3
  ),
  (
    'زراعة ضرس علوي بالتقنية الرقمية الموجهة',
    'Guided Digital Dental Implant for Molar',
    'زراعة الأسنان',
    'Dental Implant',
    'زراعة سن فوري بعد الفقد مع تاج زركونيا عالي الصلابة وبدون جراحة تقليدية.',
    'Flapless 3D guided implant placement with monolithic zirconia crown.',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=600&q=80',
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&q=80',
    8
  )
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 10. Indexes for High Performance
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_consultation_id ON public.messages(consultation_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_portfolio_cases_created ON public.portfolio_cases(created_at);

-- ==============================================================================
-- 11. Automated Trigger for New User Profile Creation
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'patient'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 12. Helper function to check if current user is doctor
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'doctor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 13. Row Level Security (RLS) Policies (Bidirectional Patient & Doctor Access)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_cases ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow all to view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all to insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all to update profiles" ON public.profiles;

CREATE POLICY "Allow all to view profiles"
  ON public.profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow all to insert profiles"
  ON public.profiles FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow all to update profiles"
  ON public.profiles FOR UPDATE
  TO public
  USING (true);

-- 2. Consultations / Complaints Policies
DROP POLICY IF EXISTS "Patients can view their own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Patients can insert their own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Doctors and owners can update consultations" ON public.consultations;
DROP POLICY IF EXISTS "Allow all to view consultations" ON public.consultations;
DROP POLICY IF EXISTS "Allow all to insert consultations" ON public.consultations;
DROP POLICY IF EXISTS "Allow all to update consultations" ON public.consultations;

CREATE POLICY "Allow all to view consultations"
  ON public.consultations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow all to insert consultations"
  ON public.consultations FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow all to update consultations"
  ON public.consultations FOR UPDATE
  TO public
  USING (true);

-- 3. Appointments Policies
DROP POLICY IF EXISTS "Patients view own appointments and doctors view all" ON public.appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors and owners can modify appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow all to view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow all to insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow all to update appointments" ON public.appointments;

CREATE POLICY "Allow all to view appointments"
  ON public.appointments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow all to insert appointments"
  ON public.appointments FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow all to update appointments"
  ON public.appointments FOR UPDATE
  TO public
  USING (true);

-- 4. Messages Policies (Chat between Patient & Doctor)
DROP POLICY IF EXISTS "Participants in consultation can view messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all to view messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all to insert messages" ON public.messages;

CREATE POLICY "Allow all to view messages"
  ON public.messages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow all to insert messages"
  ON public.messages FOR INSERT
  TO public
  WITH CHECK (true);

-- 5. Clinic Settings Policies
DROP POLICY IF EXISTS "Everyone can view clinic settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Doctors can update clinic settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Doctors can insert clinic settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Allow all to view clinic settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Allow all to manage clinic settings" ON public.clinic_settings;

CREATE POLICY "Allow all to view clinic settings"
  ON public.clinic_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow all to manage clinic settings"
  ON public.clinic_settings FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 6. Services Policies
DROP POLICY IF EXISTS "Everyone can view active services" ON public.services;
DROP POLICY IF EXISTS "Doctors can insert services" ON public.services;
DROP POLICY IF EXISTS "Doctors can update services" ON public.services;
DROP POLICY IF EXISTS "Doctors can delete services" ON public.services;
DROP POLICY IF EXISTS "Allow all to view services" ON public.services;
DROP POLICY IF EXISTS "Allow all to manage services" ON public.services;

CREATE POLICY "Allow all to view services"
  ON public.services FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow all to manage services"
  ON public.services FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 7. Portfolio Cases Policies
DROP POLICY IF EXISTS "Everyone can view portfolio cases" ON public.portfolio_cases;
DROP POLICY IF EXISTS "Doctors can insert portfolio cases" ON public.portfolio_cases;
DROP POLICY IF EXISTS "Doctors can update portfolio cases" ON public.portfolio_cases;
DROP POLICY IF EXISTS "Doctors can delete portfolio cases" ON public.portfolio_cases;
DROP POLICY IF EXISTS "Allow all to view portfolio cases" ON public.portfolio_cases;
DROP POLICY IF EXISTS "Allow all to manage portfolio cases" ON public.portfolio_cases;

CREATE POLICY "Allow all to view portfolio cases"
  ON public.portfolio_cases FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow all to manage portfolio cases"
  ON public.portfolio_cases FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 14. Storage Bucket Policies (dental-media)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('dental-media', 'dental-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access to Dental Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Allow all to view dental media" ON storage.objects;
DROP POLICY IF EXISTS "Allow all to upload dental media" ON storage.objects;

CREATE POLICY "Allow all to view dental media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'dental-media');

CREATE POLICY "Allow all to upload dental media"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'dental-media');

-- ==============================================================================
-- 15. Enable Realtime Replication (Safe Idempotence)
-- ==============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_settings;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio_cases;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ==============================================================================
-- 16. Promote Official Doctor Account (Dr. Karim Abo Bakr)
-- ==============================================================================
-- Run this in Supabase SQL Editor to link karim@smartdental.com as Doctor:
UPDATE public.profiles
SET 
  role = 'doctor',
  full_name = 'د. كريم أبو بكر',
  phone = '+20 100 000 0000'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'karim@smartdental.com'
);

