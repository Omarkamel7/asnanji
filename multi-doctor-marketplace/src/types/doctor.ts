import { UserProfile } from '.';
export interface DoctorProfile {
  id: string;
  slug: string;
  specialty: string;
  bio: string;
  clinicAddress: string;
  consultationFee: number;
  avatarUrl: string;
  isAcceptingPatients: boolean;
  rating: number;
  profileData?: Partial<UserProfile>;
}

export interface DoctorPortfolio {
  id: string;
  doctorId: string;
  title: string;
  description: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  createdAt: string;
}

export interface DoctorSettings {
  doctorId: string;
  workingDays: string[];
  timeSlots: string[];
  slotDurationMinutes: number;
  enableInstantConsultation: boolean;
  enableBooking: boolean;
  enableChat: boolean;
}

export interface DoctorReview {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentId: string;
  rating: number;
  comment: string;
  createdAt: string;
}


