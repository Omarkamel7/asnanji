const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connectionConfigs = [
    {
      host: 'aws-0-eu-west-1.pooler.supabase.com',
      port: 6543,
      user: 'postgres.nvpkcjhrwpglmyehksyd',
      password: 'SmartDental@2026Clinic',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
    },
    {
      host: 'aws-0-eu-west-1.pooler.supabase.com',
      port: 5432,
      user: 'postgres.nvpkcjhrwpglmyehksyd',
      password: 'SmartDental@2026Clinic',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
    },
    {
      host: 'db.nvpkcjhrwpglmyehksyd.supabase.co',
      port: 5432,
      user: 'postgres',
      password: 'SmartDental@2026Clinic',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
    }
  ];

  let client = null;
  let connected = false;

  for (const config of connectionConfigs) {
    try {
      console.log(`Connecting to ${config.host}:${config.port} ...`);
      client = new Client(config);
      await client.connect();
      console.log(`Connected successfully to ${config.host}:${config.port}!`);
      connected = true;
      break;
    } catch (err) {
      console.warn(`Failed to connect to ${config.host}:${config.port}: ${err.message}`);
      if (client) {
        try { await client.end(); } catch (e) {}
      }
    }
  }

  if (!connected || !client) {
    console.error('Could not connect to any Supabase host.');
    process.exit(1);
  }

  try {
    const sqlPath = path.join(__dirname, '..', 'supabase', 'fix_rls_and_realtime.sql');
    let sql = fs.readFileSync(sqlPath, 'utf8');

    // Also ensure all tables exist
    const createTablesSQL = `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

      CREATE TABLE IF NOT EXISTS public.messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        consultation_id UUID NOT NULL,
        sender_id UUID NOT NULL,
        sender_role TEXT CHECK (sender_role IN ('patient', 'doctor')) NOT NULL,
        sender_name TEXT NOT NULL,
        text TEXT DEFAULT '',
        image_url TEXT,
        audio_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

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
    `;

    console.log('Creating tables if not exist...');
    await client.query(createTablesSQL);
    console.log('Tables created or verified!');

    console.log('Executing RLS & Realtime policies...');
    await client.query(sql);
    console.log('Migration completed successfully!');

    // Verify tables count
    const res = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('Active public tables in Supabase:', res.rows.map(r => r.table_name));

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

runMigration();
