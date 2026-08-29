import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  UserRole,
  Language,
  DentalComplaint,
  Appointment,
  BeforeAfterCase,
  ChatMessage,
  PreliminaryDiagnosis,
  ClinicSettings,
  DentalService,
} from '../types';
import { translations } from '../constants/translations';
import {
  INITIAL_BEFORE_AFTER_CASES,
  DEFAULT_SERVICES,
  DEFAULT_CLINIC_SETTINGS,
} from '../constants/dentalData';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { generateUUID, isValidUUID } from '../services/uuid';

export interface DoctorInboxItem {
  consultationId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  lastMessage: string;
  lastMessageTime: string;
  urgencyLevel: string;
  status: string;
  createdAt: string;
  photoUrls: string[];
  description: string;
  symptoms: string[];
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  savePatientQuickProfile: (fullName: string, phone: string) => Promise<void>;
  complaints: DentalComplaint[];
  addComplaint: (complaint: Omit<DentalComplaint, 'id' | 'createdAt' | 'status'>) => Promise<DentalComplaint>;
  createConsultationWithChat: (
    complaintData: Omit<DentalComplaint, 'id' | 'createdAt' | 'status'>
  ) => Promise<{ consultation: DentalComplaint; consultationId: string }>;
  doctorInbox: DoctorInboxItem[];
  submitDiagnosis: (complaintId: string, diagnosis: PreliminaryDiagnosis) => Promise<void>;
  appointments: Appointment[];
  bookAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'status'>) => Promise<Appointment>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  clinicSettings: ClinicSettings;
  updateClinicSettings: (settings: Partial<ClinicSettings>) => Promise<void>;
  services: DentalService[];
  addService: (service: Omit<DentalService, 'id'>) => Promise<DentalService>;
  updateService: (service: DentalService) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  portfolioCases: BeforeAfterCase[];
  addPortfolioCase: (caseItem: Omit<BeforeAfterCase, 'id'>) => Promise<BeforeAfterCase>;
  deletePortfolioCase: (caseId: string) => Promise<void>;
  messages: ChatMessage[];
  sendMessage: (consultationId: string, text: string, audioUri?: string, imageUri?: string) => Promise<void>;
  refreshClinicData: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  t: typeof translations.ar;
  isRTL: boolean;
}

const DEFAULT_PATIENT: UserProfile = {
  id: '',
  fullName: '',
  phone: '',
  email: '',
  role: 'patient',
  gender: 'male',
  age: 0,
  medicalHistory: {
    hasDiabetes: false,
    hasHypertension: false,
    hasHeartDisease: false,
    hasBleedingDisorder: false,
    hasPenicillinAllergy: false,
    isPregnant: false,
    otherAllergies: '',
    notes: '',
  },
};

const INITIAL_COMPLAINTS: DentalComplaint[] = [];
const INITIAL_APPOINTMENTS: Appointment[] = [];
const INITIAL_MESSAGES: ChatMessage[] = [];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');
  const [role, setRoleState] = useState<UserRole>('patient');
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_PATIENT);
  const [complaints, setComplaints] = useState<DentalComplaint[]>(INITIAL_COMPLAINTS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(DEFAULT_CLINIC_SETTINGS);
  const [services, setServices] = useState<DentalService[]>(DEFAULT_SERVICES);
  const [portfolioCases, setPortfolioCases] = useState<BeforeAfterCase[]>(INITIAL_BEFORE_AFTER_CASES);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadSavedData();
    initSupabase();
  }, []);

  const loadSavedData = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('@dental_app_lang');
      if (savedLang === 'ar' || savedLang === 'en') {
        setLanguageState(savedLang);
      }
      const savedSettings = await AsyncStorage.getItem('@dental_app_clinic_settings');
      if (savedSettings) {
        setClinicSettings(JSON.parse(savedSettings));
      }
      const savedServices = await AsyncStorage.getItem('@dental_app_services');
      if (savedServices) {
        setServices(JSON.parse(savedServices));
      }
      const savedPortfolio = await AsyncStorage.getItem('@dental_app_portfolio');
      if (savedPortfolio) {
        setPortfolioCases(JSON.parse(savedPortfolio));
      }
      const savedComplaints = await AsyncStorage.getItem('@dental_app_complaints');
      if (savedComplaints) {
        setComplaints(JSON.parse(savedComplaints));
      }
      const savedAppointments = await AsyncStorage.getItem('@dental_app_appointments');
      if (savedAppointments) {
        setAppointments(JSON.parse(savedAppointments));
      }
      const savedMessages = await AsyncStorage.getItem('@dental_app_messages');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
      const savedRole = await AsyncStorage.getItem('@dental_app_role');
      if (savedRole === 'doctor' || savedRole === 'patient') {
        setRoleState(savedRole);
      }
      const savedUser = await AsyncStorage.getItem('@dental_app_current_user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser && parsedUser.id) {
            setCurrentUser(parsedUser);
          }
        } catch (_) {}
      }
      const savedPatient = await AsyncStorage.getItem('@dental_app_patient_profile');
      if (savedPatient) {
        try {
          const parsedPatient = JSON.parse(savedPatient);
          if (parsedPatient && parsedPatient.fullName) {
            setCurrentUser((prev) => (prev.id ? prev : parsedPatient));
          }
        } catch (err) {}
      }
    } catch (e) {
      console.warn('Error loading storage data:', e);
    }
  };

  const initSupabase = () => {
    if (!isSupabaseConfigured) return;

    // Fetch Initial Remote Data (Settings, Services, Portfolio)
    fetchClinicSettings();
    fetchServices();
    fetchPortfolio();
    fetchRemoteUserData();

    // Check existing auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        if (session.user.email?.toLowerCase().includes('karim@smartdental.com')) {
          setRoleState('doctor');
          AsyncStorage.setItem('@dental_app_role', 'doctor').catch(() => {});
        }
        fetchRemoteProfile(session.user.id);
        fetchRemoteUserData();
      }
    });

    // Listen to Auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        if (session.user.email?.toLowerCase().includes('karim@smartdental.com')) {
          setRoleState('doctor');
          AsyncStorage.setItem('@dental_app_role', 'doctor').catch(() => {});
        }
        fetchRemoteProfile(session.user.id);
        fetchRemoteUserData();
      } else {
        setIsAuthenticated(false);
      }
    });

    // Setup Realtime Channels for Clinic Data, Messages & Consultations
    const realtimeChannel = supabase
      .channel('clinic_updates_and_messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clinic_settings' },
        () => fetchClinicSettings()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        () => fetchServices()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'portfolio_cases' },
        () => fetchPortfolio()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'consultations' },
        () => {
          console.log('[Realtime] Consultations updated on Supabase');
          fetchRemoteUserData();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new as any;
          if (row && row.id) {
            console.log('[Realtime] New message arrived from Supabase:', row.id, row.text);
            const formatted: ChatMessage = {
              id: row.id,
              consultationId: row.consultation_id || 'general',
              senderId: row.sender_id || 'sender',
              senderName: row.sender_name || (row.sender_role === 'doctor' ? 'د. كريم أبو بكر' : 'المريض'),
              senderRole: row.sender_role || 'patient',
              text: row.text || '',
              audioUri: row.audio_url || undefined,
              imageUri: row.image_url || undefined,
              timestamp: row.created_at || new Date().toISOString(),
            };
            setMessages((prev) => {
              if (prev.some((m) => m.id === formatted.id)) return prev;
              const next = [...prev, formatted];
              AsyncStorage.setItem('@dental_app_messages', JSON.stringify(next)).catch(() => {});
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      authListener?.subscription.unsubscribe();
      supabase.removeChannel(realtimeChannel);
    };
  };

  const fetchClinicSettings = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .eq('id', 'main')
        .single();

      if (data && !error) {
        const formatted: ClinicSettings = {
          id: data.id,
          doctorName: data.doctor_name,
          doctorTitle: data.doctor_title,
          doctorBio: data.doctor_bio,
          avatarUrl: data.avatar_url || '',
          coverImageUrl: data.cover_image_url || '',
          yearsExperience: data.years_experience,
          patientsCount: data.patients_count,
          rating: Number(data.rating),
          phoneNumber: data.phone_number,
          whatsappNumber: data.whatsapp_number,
          locationAddress: data.location_address,
          locationMapsUrl: data.location_maps_url,
          workingHours: data.working_hours,
        };
        setClinicSettings(formatted);
        AsyncStorage.setItem('@dental_app_clinic_settings', JSON.stringify(formatted));
      }
    } catch (err) {
      console.warn('Error fetching clinic settings:', err);
    }
  };

  const fetchServices = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true });

      if (data && !error && data.length > 0) {
        const formatted: DentalService[] = data.map((s) => ({
          id: s.id,
          nameAr: s.name_ar,
          nameEn: s.name_en,
          descriptionAr: s.description_ar,
          descriptionEn: s.description_en,
          durationMinutes: s.duration_minutes,
          estimatedPrice: s.price,
          iconName: s.icon_name || 'Sparkles',
          category: (s.category as any) || 'restoration',
        }));
        setServices(formatted);
        AsyncStorage.setItem('@dental_app_services', JSON.stringify(formatted));
      }
    } catch (err) {
      console.warn('Error fetching services:', err);
    }
  };

  const fetchPortfolio = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('portfolio_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error && data.length > 0) {
        const formatted: BeforeAfterCase[] = data.map((p) => ({
          id: p.id,
          titleAr: p.title_ar,
          titleEn: p.title_en,
          categoryAr: p.category_ar,
          categoryEn: p.category_en,
          descriptionAr: p.description_ar,
          descriptionEn: p.description_en,
          beforeImageUrl: p.before_image_url,
          afterImageUrl: p.after_image_url,
          durationWeeks: p.duration_weeks,
          createdAt: p.created_at,
        }));
        setPortfolioCases(formatted);
        AsyncStorage.setItem('@dental_app_portfolio', JSON.stringify(formatted));
      }
    } catch (err) {
      console.warn('Error fetching portfolio:', err);
    }
  };

  const fetchRemoteProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        const userRole = (data.role as UserRole) || 'patient';
        setRoleState(userRole);
        AsyncStorage.setItem('@dental_app_role', userRole).catch(() => {});
        const updatedUser: UserProfile = {
          ...currentUser,
          id: data.id,
          fullName: data.full_name,
          phone: data.phone,
          role: userRole,
          medicalHistory: {
            ...currentUser.medicalHistory,
            hasDiabetes: data.has_diabetes || false,
            hasHypertension: data.has_hypertension || false,
            hasPenicillinAllergy: data.has_penicillin_allergy || false,
          },
        };
        setCurrentUser(updatedUser);
        AsyncStorage.setItem('@dental_app_current_user', JSON.stringify(updatedUser)).catch(() => {});
      }
    } catch (e) {
      console.warn('Fetch remote profile error:', e);
    }
  };

  const fetchRemoteUserData = async () => {
    if (!isSupabaseConfigured) return;
    try {
      // Fetch Consultations
      const { data: remoteComplaints, error: compErr } = await supabase
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false });

      if (remoteComplaints && !compErr) {
        const formatted: DentalComplaint[] = remoteComplaints.map((c) => ({
          id: c.id,
          patientId: c.patient_id,
          patientName: currentUser.fullName || 'مريض',
          patientPhone: currentUser.phone || '',
          selectedTeeth: c.affected_teeth || [],
          symptoms: c.symptoms || [],
          painLevel: c.pain_level || 5,
          description: c.description || '',
          photoUris: c.image_urls || [],
          xrayUris: [],
          medicalAlerts: c.medical_alerts || [],
          urgencyLevel: c.urgency_level || 'routine',
          status: c.status || 'pending',
          createdAt: c.created_at,
          diagnosis: c.diagnosis_text
            ? {
                diagnosedAt: c.diagnosed_at || c.created_at,
                doctorName: 'د. كريم أبو بكر',
                provisionalConditionAr: c.diagnosis_text,
                provisionalConditionEn: c.diagnosis_text,
                urgencyLevel: c.urgency_level || 'routine',
                firstAidInstructionsAr: c.first_aid_instructions || '',
                firstAidInstructionsEn: c.first_aid_instructions || '',
                recommendedMedicationsAr: c.recommended_medications || '',
                recommendedMedicationsEn: c.recommended_medications || '',
                suggestedServiceId: c.suggested_service_id || undefined,
                requireClinicVisit: true,
              }
            : undefined,
        }));
        setComplaints(formatted);
      } else {
        setComplaints([]);
      }

      // Fetch Appointments
      const { data: remoteAppointments, error: aptErr } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });

      if (remoteAppointments && !aptErr) {
        const formattedApts: Appointment[] = remoteAppointments.map((a) => ({
          id: a.id,
          patientId: a.patient_id,
          patientName: currentUser.fullName || 'مريض',
          patientPhone: currentUser.phone || '',
          serviceId: a.service_id,
          serviceNameAr: a.service_name || 'كشف واستشارة طبية',
          serviceNameEn: a.service_name || 'Dental Consultation',
          date: a.appointment_date,
          timeSlot: a.time_slot,
          status: a.status || 'confirmed',
          price: a.price || 0,
          complaintId: a.consultation_id || undefined,
          createdAt: a.created_at,
        }));
        setAppointments(formattedApts);
      } else {
        setAppointments([]);
      }

      // Fetch Chat Messages
      const { data: remoteMessages, error: msgErr } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (remoteMessages && !msgErr) {
        const formattedMsgs: ChatMessage[] = remoteMessages.map((m) => ({
          id: m.id,
          consultationId: m.consultation_id || 'general',
          senderId: m.sender_id,
          senderName: m.sender_name || (m.sender_role === 'doctor' ? 'د. كريم أبو بكر' : 'مريض'),
          senderRole: m.sender_role || 'patient',
          text: m.text || '',
          audioUri: m.audio_url || undefined,
          imageUri: m.image_url || undefined,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(formattedMsgs);
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.warn('Error fetching remote user data:', e);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('@dental_app_lang', lang);
    } catch (e) {
      console.warn('Error saving language:', e);
    }
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    AsyncStorage.setItem('@dental_app_role', newRole).catch(() => {});
  };

  const updateUserProfile = async (profileUpdate: Partial<UserProfile>) => {
    const updated = { ...currentUser, ...profileUpdate };
    setCurrentUser(updated);
    AsyncStorage.setItem('@dental_app_current_user', JSON.stringify(updated)).catch(() => {});

    if (isSupabaseConfigured && isAuthenticated) {
      try {
        await supabase
          .from('profiles')
          .update({
            full_name: updated.fullName,
            phone: updated.phone,
            has_diabetes: updated.medicalHistory.hasDiabetes,
            has_hypertension: updated.medicalHistory.hasHypertension,
            has_penicillin_allergy: updated.medicalHistory.hasPenicillinAllergy,
          })
          .eq('id', currentUser.id);
      } catch (err) {
        console.warn('Supabase update profile error:', err);
      }
    }
  };

  const refreshClinicData = async () => {
    if (!isSupabaseConfigured) return;
    try {
      await Promise.all([
        fetchClinicSettings(),
        fetchServices(),
        fetchPortfolio(),
        fetchRemoteUserData(),
      ]);
      console.log('[Supabase] Full clinic data refreshed from cloud.');
    } catch (err) {
      console.error('[Supabase] refreshClinicData error:', err);
    }
  };

  const updateClinicSettings = async (settingsUpdate: Partial<ClinicSettings>) => {
    const updated = { ...clinicSettings, ...settingsUpdate };
    setClinicSettings(updated);
    await AsyncStorage.setItem('@dental_app_clinic_settings', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        console.log('[Supabase] Upserting clinic_settings to cloud:', updated.doctorName);
        const { error } = await supabase
          .from('clinic_settings')
          .upsert({
            id: 'main',
            doctor_name: updated.doctorName,
            doctor_title: updated.doctorTitle,
            doctor_bio: updated.doctorBio,
            avatar_url: updated.avatarUrl || '',
            cover_image_url: updated.coverImageUrl || '',
            years_experience: updated.yearsExperience || 12,
            patients_count: updated.patientsCount || 3500,
            rating: updated.rating || 4.9,
            phone_number: updated.phoneNumber || '+20 100 000 0000',
            whatsapp_number: updated.whatsappNumber || '+20 100 000 0000',
            location_address: updated.locationAddress || 'مصر الجديدة - القاهرة',
            location_maps_url: updated.locationMapsUrl || 'https://maps.google.com',
            working_hours: updated.workingHours || 'السبت - الخميس: 12:00 م - 10:00 م',
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error('[Supabase] updateClinicSettings error:', error);
          throw error;
        } else {
          console.log('[Supabase] Clinic settings saved to cloud successfully');
        }
      } catch (err) {
        console.error('[Supabase] updateClinicSettings exception:', err);
        throw err;
      }
    }
  };

  const addService = async (newService: Omit<DentalService, 'id'>): Promise<DentalService> => {
    const id = `srv_${Date.now()}`;
    const serviceWithId: DentalService = { ...newService, id };
    const updated = [...services, serviceWithId];
    setServices(updated);
    await AsyncStorage.setItem('@dental_app_services', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        console.log('[Supabase] Inserting service to cloud:', id, newService.nameAr);
        const { error } = await supabase.from('services').upsert({
          id,
          name_ar: newService.nameAr,
          name_en: newService.nameEn,
          description_ar: newService.descriptionAr,
          description_en: newService.descriptionEn,
          price: newService.estimatedPrice,
          duration_minutes: newService.durationMinutes,
          icon_name: newService.iconName,
          category: newService.category,
          is_active: true,
          sort_order: updated.length,
        });

        if (error) {
          console.error('[Supabase] addService error:', error);
        } else {
          console.log('[Supabase] Service added to cloud successfully:', id);
        }
      } catch (err) {
        console.error('[Supabase] addService exception:', err);
      }
    }

    return serviceWithId;
  };

  const updateService = async (service: DentalService) => {
    const updated = services.map((s) => (s.id === service.id ? service : s));
    setServices(updated);
    await AsyncStorage.setItem('@dental_app_services', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        console.log('[Supabase] Updating service in cloud:', service.id);
        const { error } = await supabase
          .from('services')
          .upsert({
            id: service.id,
            name_ar: service.nameAr,
            name_en: service.nameEn,
            description_ar: service.descriptionAr,
            description_en: service.descriptionEn,
            price: service.estimatedPrice,
            duration_minutes: service.durationMinutes,
            icon_name: service.iconName,
            category: service.category,
            is_active: true,
          });

        if (error) {
          console.error('[Supabase] updateService error:', error);
        } else {
          console.log('[Supabase] Service updated in cloud successfully:', service.id);
        }
      } catch (err) {
        console.error('[Supabase] updateService exception:', err);
      }
    }
  };

  const deleteService = async (serviceId: string) => {
    const updated = services.filter((s) => s.id !== serviceId);
    setServices(updated);
    await AsyncStorage.setItem('@dental_app_services', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        console.log('[Supabase] Deleting service from cloud:', serviceId);
        const { error } = await supabase.from('services').delete().eq('id', serviceId);
        if (error) {
          console.error('[Supabase] deleteService error:', error);
        }
      } catch (err) {
        console.error('[Supabase] deleteService exception:', err);
      }
    }
  };

  const addPortfolioCase = async (
    caseItem: Omit<BeforeAfterCase, 'id'>
  ): Promise<BeforeAfterCase> => {
    const id = generateUUID();
    const newCase: BeforeAfterCase = { ...caseItem, id, createdAt: new Date().toISOString() };
    const updated = [newCase, ...portfolioCases];
    setPortfolioCases(updated);
    await AsyncStorage.setItem('@dental_app_portfolio', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        console.log('[Supabase] Inserting portfolio case to cloud:', id, caseItem.titleAr);
        const { error } = await supabase.from('portfolio_cases').insert({
          id,
          title_ar: caseItem.titleAr,
          title_en: caseItem.titleEn,
          category_ar: caseItem.categoryAr,
          category_en: caseItem.categoryEn,
          description_ar: caseItem.descriptionAr,
          description_en: caseItem.descriptionEn,
          before_image_url: caseItem.beforeImageUrl,
          after_image_url: caseItem.afterImageUrl,
          duration_weeks: caseItem.durationWeeks || 2,
        });

        if (error) {
          console.error('[Supabase] addPortfolioCase error:', error);
        } else {
          console.log('[Supabase] Portfolio case added to cloud successfully:', id);
        }
      } catch (err) {
        console.error('[Supabase] addPortfolioCase exception:', err);
      }
    }

    return newCase;
  };

  const deletePortfolioCase = async (caseId: string) => {
    const updated = portfolioCases.filter((p) => p.id !== caseId);
    setPortfolioCases(updated);
    await AsyncStorage.setItem('@dental_app_portfolio', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        console.log('[Supabase] Deleting portfolio case from cloud:', caseId);
        const { error } = await supabase.from('portfolio_cases').delete().eq('id', caseId);
        if (error) {
          console.error('[Supabase] deletePortfolioCase error:', error);
        }
      } catch (err) {
        console.error('[Supabase] deletePortfolioCase exception:', err);
      }
    }
  };

  const addComplaint = async (
    complaintData: Omit<DentalComplaint, 'id' | 'createdAt' | 'status'>
  ): Promise<DentalComplaint> => {
    const newId = `comp_${Date.now()}`;
    const newComplaint: DentalComplaint = {
      ...complaintData,
      id: newId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const updated = [newComplaint, ...complaints];
    setComplaints(updated);
    await AsyncStorage.setItem('@dental_app_complaints', JSON.stringify(updated));
    return newComplaint;
  };

  const submitDiagnosis = async (complaintId: string, diagnosis: PreliminaryDiagnosis) => {
    const updated = complaints.map((c) => {
      if (c.id === complaintId) {
        return {
          ...c,
          status: 'diagnosed' as const,
          diagnosis,
        };
      }
      return c;
    });
    setComplaints(updated);
    await AsyncStorage.setItem('@dental_app_complaints', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('consultations')
          .update({
            status: 'diagnosed',
            diagnosis_text: diagnosis.provisionalConditionAr,
            first_aid_instructions: diagnosis.firstAidInstructionsAr,
            recommended_medications: diagnosis.recommendedMedicationsAr,
            suggested_service_id: diagnosis.suggestedServiceId || null,
            diagnosed_at: new Date().toISOString(),
          })
          .eq('id', complaintId);
      } catch (err) {
        console.warn('Supabase submit diagnosis error:', err);
      }
    }
  };

  const bookAppointment = async (
    appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'status'>
  ): Promise<Appointment> => {
    const newId = `apt_${Date.now()}`;
    const newAppointment: Appointment = {
      ...appointmentData,
      id: newId,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    const updated = [newAppointment, ...appointments];
    setAppointments(updated);
    await AsyncStorage.setItem('@dental_app_appointments', JSON.stringify(updated));
    return newAppointment;
  };

  const cancelAppointment = async (appointmentId: string) => {
    const updated = appointments.map((a) =>
      a.id === appointmentId ? { ...a, status: 'cancelled' as const } : a
    );
    setAppointments(updated);
    await AsyncStorage.setItem('@dental_app_appointments', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', appointmentId);
      } catch (err) {
        console.warn('Supabase cancel appointment error:', err);
      }
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
    setRoleState('patient');
    setCurrentUser(DEFAULT_PATIENT);
    await AsyncStorage.removeItem('@dental_app_role');
    await AsyncStorage.removeItem('@dental_app_current_user');
  };

  const savePatientQuickProfile = async (fullName: string, phone: string) => {
    const patientId = isValidUUID(currentUser.id) ? currentUser.id : generateUUID();
    const updated: UserProfile = {
      ...currentUser,
      id: patientId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      role: 'patient',
    };
    setCurrentUser(updated);
    await AsyncStorage.setItem('@dental_app_patient_profile', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        const { error } = await (supabase.from('profiles') as any).upsert({
          id: patientId,
          full_name: fullName.trim(),
          phone: phone.trim(),
          role: 'patient',
        });
        if (error) {
          console.error('[Supabase] savePatientQuickProfile error:', error);
        } else {
          console.log('[Supabase] Patient profile synced successfully:', patientId);
        }
      } catch (err) {
        console.error('[Supabase] Error syncing quick patient profile:', err);
      }
    }
  };

  const createConsultationWithChat = async (
    complaintData: Omit<DentalComplaint, 'id' | 'createdAt' | 'status'>
  ): Promise<{ consultation: DentalComplaint; consultationId: string }> => {
    const newId = generateUUID();
    const validPatientId = isValidUUID(complaintData.patientId || currentUser.id)
      ? (complaintData.patientId || currentUser.id)
      : generateUUID();

    const newComplaint: DentalComplaint = {
      ...complaintData,
      id: newId,
      patientId: validPatientId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const updatedComplaints = [newComplaint, ...complaints];
    setComplaints(updatedComplaints);
    await AsyncStorage.setItem('@dental_app_complaints', JSON.stringify(updatedComplaints));

    // Construct structured clinical introduction message for the chat
    const symptomsLabel = complaintData.symptoms && complaintData.symptoms.length > 0
      ? complaintData.symptoms.join('، ')
      : 'استشارة وفحص عام';
    const teethLabel = complaintData.selectedTeeth && complaintData.selectedTeeth.length > 0
      ? `السن رقم: #${complaintData.selectedTeeth.join(', #')}`
      : 'فحص الفك بالكامل';
    
    const initialText = `🚨 طلب استشارة طبية جديد:\n• الأعراض: ${symptomsLabel}\n• موضع الشكوى: ${teethLabel}\n• شدة الألم: ${complaintData.painLevel || 5}/10\n• تفاصيل الحالة: ${complaintData.description || 'لا يوجد وصف إضافي'}`;

    const newMsgId = generateUUID();
    const newMsg: ChatMessage = {
      id: newMsgId,
      consultationId: newId,
      senderId: validPatientId,
      senderName: complaintData.patientName || currentUser.fullName || 'المريض',
      senderRole: 'patient',
      text: initialText,
      imageUri: complaintData.photoUris && complaintData.photoUris.length > 0 ? complaintData.photoUris[0] : undefined,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    await AsyncStorage.setItem('@dental_app_messages', JSON.stringify(updatedMessages));

    if (isSupabaseConfigured) {
      try {
        // 1. Insert into consultations table
        const { error: compError } = await supabase.from('consultations').insert({
          id: newId,
          patient_id: validPatientId,
          affected_teeth: complaintData.selectedTeeth || [],
          symptoms: complaintData.symptoms || [],
          pain_level: complaintData.painLevel || 5,
          description: complaintData.description || '',
          image_urls: complaintData.photoUris || [],
          medical_alerts: complaintData.medicalAlerts || [],
          urgency_level: complaintData.urgencyLevel || 'routine',
          status: 'pending',
        });

        if (compError) {
          console.error('[Supabase] createConsultation insert error:', compError);
        } else {
          console.log('[Supabase] Consultation inserted successfully:', newId);
        }

        // 2. Insert initial summary message into messages table
        const { error: msgError } = await supabase.from('messages').insert({
          id: newMsgId,
          consultation_id: newId,
          sender_id: validPatientId,
          sender_role: 'patient',
          sender_name: complaintData.patientName || currentUser.fullName || 'المريض',
          text: initialText,
          image_url: complaintData.photoUris && complaintData.photoUris.length > 0 ? complaintData.photoUris[0] : null,
        });

        if (msgError) {
          console.error('[Supabase] createConsultation initial message error:', msgError);
        }
      } catch (err) {
        console.error('[Supabase] createConsultationWithChat exception:', err);
      }
    }

    return { consultation: newComplaint, consultationId: newId };
  };

  // Derive Doctor Inbox items from both complaints and direct chat messages with useMemo
  const doctorInbox: DoctorInboxItem[] = useMemo(() => {
    const messageThreads = new Map<string, ChatMessage[]>();
    messages.forEach((m) => {
      const cId = m.consultationId || 'general';
      if (!messageThreads.has(cId)) {
        messageThreads.set(cId, []);
      }
      messageThreads.get(cId)!.push(m);
    });

    const inboxList: DoctorInboxItem[] = [];
    const processedConsultationIds = new Set<string>();

    // 1. Add all structured complaints
    complaints.forEach((comp) => {
      processedConsultationIds.add(comp.id);
      const thread = messageThreads.get(comp.id) || [];
      const lastMsg = thread.length > 0 ? thread[thread.length - 1] : null;

      inboxList.push({
        consultationId: comp.id,
        patientId: comp.patientId,
        patientName: comp.patientName || 'مريض',
        patientPhone: comp.patientPhone || '',
        lastMessage: lastMsg ? lastMsg.text : comp.description || 'طلب استشارة جديد',
        lastMessageTime: lastMsg
          ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date(comp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        urgencyLevel: comp.urgencyLevel,
        status: comp.status,
        createdAt: comp.createdAt,
        photoUrls: comp.photoUris || [],
        description: comp.description || '',
        symptoms: comp.symptoms || [],
      });
    });

    // 2. Add any standalone patient chat messages that were sent directly
    messageThreads.forEach((thread, cId) => {
      if (!processedConsultationIds.has(cId)) {
        processedConsultationIds.add(cId);
        const lastMsg = thread[thread.length - 1];
        const patientMsg = thread.find((m) => m.senderRole === 'patient') || lastMsg;

        inboxList.push({
          consultationId: cId,
          patientId: patientMsg?.senderId || 'patient',
          patientName: patientMsg?.senderName || 'مريض (محادثة مباشرة)',
          patientPhone: '',
          lastMessage: lastMsg ? lastMsg.text : 'محادثة مباشرة',
          lastMessageTime: lastMsg
            ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          urgencyLevel: 'moderate',
          status: 'pending',
          createdAt: lastMsg?.timestamp || new Date().toISOString(),
          photoUrls: thread.filter((m) => !!m.imageUri).map((m) => m.imageUri!),
          description: 'محادثة واستفسار مباشر مع دكتور كريم',
          symptoms: [],
        });
      }
    });

    return inboxList;
  }, [complaints, messages]);

  const sendMessage = useCallback(
    async (
      consultationId: string,
      text: string,
      audioUri?: string,
      imageUri?: string
    ) => {
      const msgId = generateUUID();
      const validConsultationId = isValidUUID(consultationId) ? consultationId : (complaints[0]?.id || generateUUID());
      const validSenderId = isValidUUID(currentUser.id) ? currentUser.id : generateUUID();

      // 1. Optimistic Message (shown immediately with status 'sending')
      const newMsg: ChatMessage = {
        id: msgId,
        consultationId: validConsultationId,
        senderId: validSenderId,
        senderName: role === 'doctor' ? 'د. كريم أبو بكر' : (currentUser.fullName || 'المريض'),
        senderRole: role,
        text,
        audioUri,
        imageUri,
        timestamp: new Date().toISOString(),
        status: 'sending',
      };

      setMessages((prev) => {
        const next = [...prev, newMsg];
        AsyncStorage.setItem('@dental_app_messages', JSON.stringify(next)).catch(() => {});
        return next;
      });

      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('messages').insert({
            id: msgId,
            consultation_id: validConsultationId,
            sender_id: validSenderId,
            sender_role: role,
            sender_name: role === 'doctor' ? 'د. كريم أبو بكر' : (currentUser.fullName || 'المريض'),
            text,
            image_url: imageUri || null,
            audio_url: audioUri || null,
          });

          if (error) {
            console.error('[Supabase] Send message error:', error);
            setMessages((prev) =>
              prev.map((m) => (m.id === msgId ? { ...m, status: 'failed' } : m))
            );
          } else {
            setMessages((prev) =>
              prev.map((m) => (m.id === msgId ? { ...m, status: 'sent' } : m))
            );
          }
        } catch (err) {
          console.error('[Supabase] Send message exception:', err);
          setMessages((prev) =>
            prev.map((m) => (m.id === msgId ? { ...m, status: 'failed' } : m))
          );
        }
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, status: 'sent' } : m))
        );
      }
    },
    [complaints, currentUser.id, currentUser.fullName, role]
  );

  const t = translations[language];
  const isRTL = language === 'ar';

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      role,
      setRole,
      currentUser,
      updateUserProfile,
      savePatientQuickProfile,
      complaints,
      addComplaint,
      createConsultationWithChat,
      doctorInbox,
      submitDiagnosis,
      appointments,
      bookAppointment,
      cancelAppointment,
      clinicSettings,
      updateClinicSettings,
      services,
      addService,
      updateService,
      deleteService,
      portfolioCases,
      addPortfolioCase,
      deletePortfolioCase,
      messages,
      sendMessage,
      refreshClinicData,
      signOut,
      isAuthenticated,
      t,
      isRTL,
    }),
    [
      language,
      role,
      currentUser,
      complaints,
      doctorInbox,
      appointments,
      clinicSettings,
      services,
      portfolioCases,
      messages,
      sendMessage,
      isAuthenticated,
      t,
      isRTL,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
