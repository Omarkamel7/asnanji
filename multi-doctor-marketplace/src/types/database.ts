export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'patient' | 'doctor';
export type UrgencyLevel = 'emergency' | 'urgent' | 'moderate' | 'routine';
export type ConsultationStatus = 'pending' | 'diagnosed' | 'appointment_booked';
export type AppointmentStatus = 'confirmed' | 'cancelled' | 'completed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          role: UserRole;
          has_diabetes: boolean;
          has_hypertension: boolean;
          has_penicillin_allergy: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string;
          role?: UserRole;
          has_diabetes?: boolean;
          has_hypertension?: boolean;
          has_penicillin_allergy?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string;
          role?: UserRole;
          has_diabetes?: boolean;
          has_hypertension?: boolean;
          has_penicillin_allergy?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      consultations: {
        Row: {
          id: string;
          patient_id: string;
          affected_teeth: number[];
          symptoms: string[];
          pain_level: number;
          description: string;
          image_urls: string[];
          audio_url: string | null;
          medical_alerts: string[];
          urgency_level: UrgencyLevel;
          status: ConsultationStatus;
          diagnosis_text: string | null;
          first_aid_instructions: string | null;
          recommended_medications: string | null;
          suggested_service_id: string | null;
          diagnosed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          affected_teeth: number[];
          symptoms: string[];
          pain_level: number;
          description: string;
          image_urls?: string[];
          audio_url?: string | null;
          medical_alerts?: string[];
          urgency_level?: UrgencyLevel;
          status?: ConsultationStatus;
          diagnosis_text?: string | null;
          first_aid_instructions?: string | null;
          recommended_medications?: string | null;
          suggested_service_id?: string | null;
          diagnosed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          affected_teeth?: number[];
          symptoms?: string[];
          pain_level?: number;
          description?: string;
          image_urls?: string[];
          audio_url?: string | null;
          medical_alerts?: string[];
          urgency_level?: UrgencyLevel;
          status?: ConsultationStatus;
          diagnosis_text?: string | null;
          first_aid_instructions?: string | null;
          recommended_medications?: string | null;
          suggested_service_id?: string | null;
          diagnosed_at?: string | null;
          created_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          consultation_id: string | null;
          service_id: string;
          service_name: string;
          appointment_date: string;
          time_slot: string;
          price: number;
          status: AppointmentStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          consultation_id?: string | null;
          service_id: string;
          service_name: string;
          appointment_date: string;
          time_slot: string;
          price?: number;
          status?: AppointmentStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          consultation_id?: string | null;
          service_id?: string;
          service_name?: string;
          appointment_date?: string;
          time_slot?: string;
          price?: number;
          status?: AppointmentStatus;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          consultation_id: string;
          sender_id: string;
          sender_role: UserRole;
          sender_name: string;
          text: string;
          image_url: string | null;
          audio_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          consultation_id: string;
          sender_id: string;
          sender_role: UserRole;
          sender_name: string;
          text: string;
          image_url?: string | null;
          audio_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          consultation_id?: string;
          sender_id?: string;
          sender_role?: UserRole;
          sender_name?: string;
          text?: string;
          image_url?: string | null;
          audio_url?: string | null;
          created_at?: string;
        };
      };
      clinic_settings: {
        Row: {
          id: string;
          doctor_name: string;
          doctor_title: string;
          doctor_bio: string;
          avatar_url: string;
          cover_image_url: string;
          years_experience: number;
          patients_count: number;
          rating: number;
          phone_number: string;
          whatsapp_number: string;
          location_address: string;
          location_maps_url: string;
          working_hours: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doctor_name?: string;
          doctor_title?: string;
          doctor_bio?: string;
          avatar_url?: string;
          cover_image_url?: string;
          years_experience?: number;
          patients_count?: number;
          rating?: number;
          phone_number?: string;
          whatsapp_number?: string;
          location_address?: string;
          location_maps_url?: string;
          working_hours?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          doctor_name?: string;
          doctor_title?: string;
          doctor_bio?: string;
          avatar_url?: string;
          cover_image_url?: string;
          years_experience?: number;
          patients_count?: number;
          rating?: number;
          phone_number?: string;
          whatsapp_number?: string;
          location_address?: string;
          location_maps_url?: string;
          working_hours?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string;
          description_ar: string;
          description_en: string;
          price: number;
          duration_minutes: number;
          icon_name: string;
          category: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name_ar: string;
          name_en: string;
          description_ar: string;
          description_en: string;
          price?: number;
          duration_minutes?: number;
          icon_name?: string;
          category?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name_ar?: string;
          name_en?: string;
          description_ar?: string;
          description_en?: string;
          price?: number;
          duration_minutes?: number;
          icon_name?: string;
          category?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      portfolio_cases: {
        Row: {
          id: string;
          title_ar: string;
          title_en: string;
          category_ar: string;
          category_en: string;
          description_ar: string;
          description_en: string;
          before_image_url: string;
          after_image_url: string;
          duration_weeks: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title_ar: string;
          title_en: string;
          category_ar?: string;
          category_en?: string;
          description_ar: string;
          description_en: string;
          before_image_url: string;
          after_image_url: string;
          duration_weeks?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title_ar?: string;
          title_en?: string;
          category_ar?: string;
          category_en?: string;
          description_ar?: string;
          description_en?: string;
          before_image_url?: string;
          after_image_url?: string;
          duration_weeks?: number;
          created_at?: string;
        };
      };
    };
  };
}
