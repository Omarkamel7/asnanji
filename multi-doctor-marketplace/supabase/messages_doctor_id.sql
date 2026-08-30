ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE;

-- Backfill doctor_id based on consultation
UPDATE public.messages m
SET doctor_id = c.doctor_id
FROM public.consultations c
WHERE m.consultation_id = c.id;

-- Add it to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
