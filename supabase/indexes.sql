-- Performance indexes for Smart Dental Clinic
-- Run in Supabase SQL Editor

-- Speed up booked slot checks for the same day
CREATE INDEX IF NOT EXISTS idx_appointments_date_slot
  ON appointments(appointment_date, time_slot)
  WHERE status = 'confirmed';

-- Speed up chat message loading (ordered by time within a consultation)
CREATE INDEX IF NOT EXISTS idx_messages_consultation_created
  ON messages(consultation_id, created_at);

-- Speed up doctor dashboard queries for pending consultations
CREATE INDEX IF NOT EXISTS idx_consultations_status
  ON consultations(status)
  WHERE status = 'pending';

-- Speed up patient appointment lookups
CREATE INDEX IF NOT EXISTS idx_appointments_patient
  ON appointments(patient_id, appointment_date DESC);

-- Speed up messages by sender for filtering
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON messages(sender_id);
