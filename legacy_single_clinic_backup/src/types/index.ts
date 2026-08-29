export type UserRole = 'patient' | 'doctor' | 'admin';

export type Language = 'ar' | 'en';

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: UserRole;
  gender: 'male' | 'female';
  age?: number;
  avatarUrl?: string;
  medicalHistory: {
    hasDiabetes: boolean;
    hasHypertension: boolean;
    hasHeartDisease: boolean;
    hasBleedingDisorder: boolean;
    hasPenicillinAllergy: boolean;
    isPregnant: boolean;
    otherAllergies: string;
    notes: string;
  };
}

export interface ToothInfo {
  fdiNumber: number; // e.g. 18 to 48
  quadrant: 1 | 2 | 3 | 4; // 1: Upper Right, 2: Upper Left, 3: Lower Left, 4: Lower Right
  nameAr: string;
  nameEn: string;
  type: 'incisor' | 'canine' | 'premolar' | 'molar' | 'wisdom';
}

export type UrgencyLevel = 'emergency' | 'urgent' | 'moderate' | 'routine';

export type ComplaintStatus = 'pending' | 'diagnosed' | 'appointment_booked' | 'resolved';

export interface PreliminaryDiagnosis {
  diagnosedAt: string;
  doctorName: string;
  provisionalConditionAr: string;
  provisionalConditionEn: string;
  urgencyLevel: UrgencyLevel;
  firstAidInstructionsAr: string;
  firstAidInstructionsEn: string;
  recommendedMedicationsAr?: string;
  recommendedMedicationsEn?: string;
  suggestedServiceId?: string;
  requireClinicVisit: boolean;
}

export interface DentalComplaint {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  selectedTeeth: number[]; // FDI numbers
  symptoms: string[]; // e.g., 'continuous_pain', 'cold_sensitivity', 'hot_sensitivity', 'swelling', 'bleeding_gums', 'broken_tooth', 'chewing_pain'
  painLevel: number; // 1 to 10
  description: string;
  audioNoteUri?: string;
  photoUris: string[];
  xrayUris: string[];
  medicalAlerts: string[];
  urgencyLevel: UrgencyLevel;
  status: ComplaintStatus;
  createdAt: string;
  diagnosis?: PreliminaryDiagnosis;
}

export interface DentalService {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  durationMinutes: number;
  estimatedPrice: number;
  iconName: string;
  category: 'checkup' | 'restoration' | 'endodontics' | 'cosmetics' | 'surgery' | 'orthodontics';
}

export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'rescheduled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  serviceId: string;
  serviceNameAr: string;
  serviceNameEn: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "17:30 - 18:00"
  status: AppointmentStatus;
  complaintId?: string;
  price: number;
  doctorNotes?: string;
  createdAt: string;
}

export interface BeforeAfterCase {
  id: string;
  titleAr: string;
  titleEn: string;
  categoryAr: string;
  categoryEn: string;
  descriptionAr: string;
  descriptionEn: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  dentistName?: string;
  durationWeeks?: number;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  consultationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  audioUri?: string;
  imageUri?: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'failed';
}

export interface ClinicSettings {
  id: string;
  doctorName: string;
  doctorTitle: string;
  doctorBio: string;
  avatarUrl: string;
  coverImageUrl: string;
  yearsExperience: number;
  patientsCount: number;
  rating: number;
  phoneNumber: string;
  whatsappNumber: string;
  locationAddress: string;
  locationMapsUrl: string;
  workingHours: string;
  showClinicInfo?: boolean;
  promoBadgeEnabled?: boolean;
  promoBadgeText?: string;
}

export interface ClinicInfo {
  nameAr: string;
  nameEn: string;
  doctorNameAr: string;
  doctorNameEn: string;
  doctorTitleAr: string;
  doctorTitleEn: string;
  addressAr: string;
  addressEn: string;
  phone: string;
  whatsapp: string;
  workingDaysAr: string;
  workingDaysEn: string;
  workingHoursAr: string;
  workingHoursEn: string;
  mapLatitude: number;
  mapLongitude: number;
  experienceYears: number;
  rating: number;
  reviewCount: number;
}
