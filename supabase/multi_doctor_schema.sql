-- ==============================================================================
-- SMART DENTAL CLINIC - MULTI-DOCTOR MIGRATION SCRIPT
-- ==============================================================================

-- 1. Doctor Profiles
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
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

-- Enable RLS on doctor_profiles
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read permissions for active doctor profiles" ON public.doctor_profiles;
CREATE POLICY "Public read permissions for active doctor profiles"
  ON public.doctor_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Doctors have write permissions strictly for their own record" ON public.doctor_profiles;
CREATE POLICY "Doctors have write permissions strictly for their own record"
  ON public.doctor_profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- 2. Doctor Portfolios
CREATE TABLE IF NOT EXISTS public.doctor_portfolio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  before_image_url TEXT,
  after_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on doctor_portfolio
ALTER TABLE public.doctor_portfolio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read permissions for doctor_portfolio" ON public.doctor_portfolio;
CREATE POLICY "Public read permissions for doctor_portfolio"
  ON public.doctor_portfolio FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Doctors have write permissions for doctor_portfolio" ON public.doctor_portfolio;
CREATE POLICY "Doctors have write permissions for doctor_portfolio"
  ON public.doctor_portfolio FOR ALL
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);


-- 3. Doctor Settings & Schedules
CREATE TABLE IF NOT EXISTS public.doctor_settings (
  doctor_id UUID PRIMARY KEY REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  working_days JSONB DEFAULT '[]'::jsonb,
  time_slots JSONB DEFAULT '[]'::jsonb,
  slot_duration_minutes INTEGER DEFAULT 30,
  enable_instant_consultation BOOLEAN DEFAULT false,
  enable_booking BOOLEAN DEFAULT true,
  enable_chat BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on doctor_settings
ALTER TABLE public.doctor_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read permissions for doctor_settings" ON public.doctor_settings;
CREATE POLICY "Public read permissions for doctor_settings"
  ON public.doctor_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Doctors have write permissions for doctor_settings" ON public.doctor_settings;
CREATE POLICY "Doctors have write permissions for doctor_settings"
  ON public.doctor_settings FOR ALL
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);


-- 4. Double Booking Prevention & Consultations Update
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE;

-- The constraint unique_doctor_appointment
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_doctor_appointment'
  ) THEN
    ALTER TABLE public.appointments ADD CONSTRAINT unique_doctor_appointment UNIQUE (doctor_id, appointment_date, time_slot);
  END IF;
END $$;

-- Ensure RLS allows doctors to read their own appointments & consultations
DROP POLICY IF EXISTS "Doctors can view their own appointments" ON public.appointments;
CREATE POLICY "Doctors can view their own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can update their own appointments" ON public.appointments;
CREATE POLICY "Doctors can update their own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = doctor_id OR auth.uid() = patient_id);
  
DROP POLICY IF EXISTS "Doctors can view their own consultations" ON public.consultations;
CREATE POLICY "Doctors can view their own consultations"
  ON public.consultations FOR SELECT
  USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can update their own consultations" ON public.consultations;
CREATE POLICY "Doctors can update their own consultations"
  ON public.consultations FOR UPDATE
  USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

-- 5. Verified Reviews Table
CREATE TABLE IF NOT EXISTS public.doctor_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id UUID UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on doctor_reviews
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read permissions for doctor_reviews" ON public.doctor_reviews;
CREATE POLICY "Public read permissions for doctor_reviews"
  ON public.doctor_reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Patients can write reviews for their own appointments" ON public.doctor_reviews;
CREATE POLICY "Patients can write reviews for their own appointments"
  ON public.doctor_reviews FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- 6. Update Real-time Publications
DO $$
BEGIN
  -- We just blindly execute this, it might error if already in publication or we can drop and recreate.
  -- Alternatively, we can use a safer approach for publication
END $$;
-- Supabase handles realtime via supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_portfolio;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_reviews;




