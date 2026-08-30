-- ==============================================================================
-- FIX RLS & REALTIME POLICIES FOR SMART DENTAL CLINIC
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/nvpkcjhrwpglmyehksyd/sql)
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_cases ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies (Public Read & Write)
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow all to view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all to insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all to update profiles" ON public.profiles;

CREATE POLICY "Allow all to view profiles" ON public.profiles FOR SELECT TO public USING (true);
CREATE POLICY "Allow all to insert profiles" ON public.profiles FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all to update profiles" ON public.profiles FOR UPDATE TO public USING (true);

-- 3. Consultations Policies (Public Read & Write)
DROP POLICY IF EXISTS "Patients can view their own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Patients can insert their own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Doctors and owners can update consultations" ON public.consultations;
DROP POLICY IF EXISTS "Allow all to view consultations" ON public.consultations;
DROP POLICY IF EXISTS "Allow all to insert consultations" ON public.consultations;
DROP POLICY IF EXISTS "Allow all to update consultations" ON public.consultations;

CREATE POLICY "Allow all to view consultations" ON public.consultations FOR SELECT TO public USING (true);
CREATE POLICY "Allow all to insert consultations" ON public.consultations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all to update consultations" ON public.consultations FOR UPDATE TO public USING (true);

-- 4. Messages Policies (Public Read & Write for seamless real-time messaging)
DROP POLICY IF EXISTS "Participants in consultation can view messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all to view messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all to insert messages" ON public.messages;

CREATE POLICY "Allow all to view messages" ON public.messages FOR SELECT TO public USING (true);
CREATE POLICY "Allow all to insert messages" ON public.messages FOR INSERT TO public WITH CHECK (true);

-- 5. Appointments Policies (Public Read & Write)
DROP POLICY IF EXISTS "Patients view own appointments and doctors view all" ON public.appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors and owners can modify appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow all to view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow all to insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow all to update appointments" ON public.appointments;

CREATE POLICY "Allow all to view appointments" ON public.appointments FOR SELECT TO public USING (true);
CREATE POLICY "Allow all to insert appointments" ON public.appointments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all to update appointments" ON public.appointments FOR UPDATE TO public USING (true);

-- 6. Clinic Settings Policies (Public Read & Write)
DROP POLICY IF EXISTS "Everyone can view clinic settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Doctors can update clinic settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Doctors can insert clinic settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Allow all to view clinic settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Allow all to manage clinic settings" ON public.clinic_settings;

CREATE POLICY "Allow all to view clinic settings" ON public.clinic_settings FOR SELECT TO public USING (true);
CREATE POLICY "Allow all to manage clinic settings" ON public.clinic_settings FOR ALL TO public USING (true) WITH CHECK (true);

-- 7. Services Policies (Public Read & Write)
DROP POLICY IF EXISTS "Everyone can view active services" ON public.services;
DROP POLICY IF EXISTS "Doctors can insert services" ON public.services;
DROP POLICY IF EXISTS "Doctors can update services" ON public.services;
DROP POLICY IF EXISTS "Doctors can delete services" ON public.services;
DROP POLICY IF EXISTS "Allow all to view services" ON public.services;
DROP POLICY IF EXISTS "Allow all to manage services" ON public.services;

CREATE POLICY "Allow all to view services" ON public.services FOR SELECT TO public USING (true);
CREATE POLICY "Allow all to manage services" ON public.services FOR ALL TO public USING (true) WITH CHECK (true);

-- 8. Portfolio Cases Policies (Public Read & Write)
DROP POLICY IF EXISTS "Everyone can view portfolio cases" ON public.portfolio_cases;
DROP POLICY IF EXISTS "Doctors can insert portfolio cases" ON public.portfolio_cases;
DROP POLICY IF EXISTS "Doctors can update portfolio cases" ON public.portfolio_cases;
DROP POLICY IF EXISTS "Doctors can delete portfolio cases" ON public.portfolio_cases;
DROP POLICY IF EXISTS "Allow all to view portfolio cases" ON public.portfolio_cases;
DROP POLICY IF EXISTS "Allow all to manage portfolio cases" ON public.portfolio_cases;

CREATE POLICY "Allow all to view portfolio cases" ON public.portfolio_cases FOR SELECT TO public USING (true);
CREATE POLICY "Allow all to manage portfolio cases" ON public.portfolio_cases FOR ALL TO public USING (true) WITH CHECK (true);

-- 9. Storage Bucket Policies (dental-media)
INSERT INTO storage.buckets (id, name, public)
VALUES ('dental-media', 'dental-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access to Dental Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Allow all to view dental media" ON storage.objects;
DROP POLICY IF EXISTS "Allow all to upload dental media" ON storage.objects;

CREATE POLICY "Allow all to view dental media" ON storage.objects FOR SELECT TO public USING (bucket_id = 'dental-media');
CREATE POLICY "Allow all to upload dental media" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'dental-media');

-- 10. Enable Supabase Realtime for instant updates across devices (Safe idempotence)
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

-- 11. Ensure Doctor Role for Dr. Karim (karim@smartdental.com)
UPDATE public.profiles
SET 
  role = 'doctor',
  full_name = 'د. كريم أبو بكر',
  phone = '+20 100 000 0000'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'karim@smartdental.com'
);
