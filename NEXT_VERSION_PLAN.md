# 📋 Engineering Master Plan: Release v1.1.0 - Asnanji Platform SaaS

> 📌 **Plan Status**: Approved & Active (In Progress).  
> 🎯 **Target Version**: `v1.1.0`  
> 🏢 **Core Domain**: Multi-Doctor SaaS Marketplace & Dental Practice Management.

---

## 🎯 Executive Summary & Objectives

This document establishes the full engineering roadmap for **Asnanji v1.1.0**. The release addresses all field-testing discoveries, upgrades brand identity to the new official 3D assets, installs a realistic 3D dental arch model, introduces friction-free Google OAuth + zero-cost phone linkage, implements professional doctor credentialing & verification, enables clinic receptionist/assistant delegation, and builds out a comprehensive Electronic Dental Record (EDR) with smart PDF prescriptions.

---

## 🛑 Testing Feedback & Solved Architectural Flaws

### 1. Network Connectivity & Supabase State
- **Root Cause**: The Supabase cloud project `nvpkcjhrwpglmyehksyd.supabase.co` was paused on the free tier.
- **Resolution**: Backend unpaused and verified active via live REST checks.
- **Architecture Addition**: Implement graceful offline caching and informative network status alerts across all auth and intake flows.

### 2. Doctor Registration UX Redundancy
- **Issue**: Auth screen had conflicting entry points: upper toggle `[Patient / Doctor]` vs. bottom green button `[➕ Add New Doctor (Admin Panel)]`.
- **Engineering Fix**:
  - Unify onboarding: Public registration provides one-tap Google login or email signup for patients.
  - Doctors join through an elegant, dedicated flow: **«Are you a dentist? Apply to join Asnanji Network 👨‍⚕️»**.
  - Remove public admin button completely; move clinic provisioning to secure admin governance.

### 3. Dental Chart Mojibake & 3D Anatomical Arch Replacement
- **Issue**:
  1. `DentalChart.tsx` suffered UTF-8 mojibake (corrupted Arabic labels like `ط§ظ„ظپظƒ ط§ظ„ط¹ظ„ظˆظٹ`).
  2. The old UI used primitive grey rectangular blocks that were unnatural to tap and read.
- **Engineering Fix**:
  1. Replace primitive blocks with the approved realistic 3D typhodont model (`dental_model_reference.jpg`).
  2. Implement responsive interactive tooth hotspots (teeth 1–32: Upper & Lower arches, incisors, canines, premolars, molars, wisdom teeth).
  3. Clean UTF-8 Arabic medical terminology with light haptic feedback on selection.

### 4. Official Brand Identity & Visual Assets Rollout
- **Asset**: High-resolution 3D official logo (`new_official_logo.png`) featuring blue tooth with brace & chat bubble.
- **Integration Points**:
  - `icon.png` and `adaptive-icon.png` generated at 1024x1024 for Android.
  - Centered Splash screen (`splash.png`) on clean backdrop.
  - App headers across `HomeScreen`, `ProfileScreen`, and `DoctorDashboardScreen`.
  - Prescription PDF headers.

### 5. Animated Welcome Onboarding & Hero Banner
- **Experience**: First-time users see a smooth 3-slide walkthrough (persisted in `AsyncStorage` key `@has_seen_onboarding`):
  1. 🩺 Remote Consultation & AI-assisted triage.
  2. 📅 Seamless Appointment Scheduling.
  3. 📁 Lifetime EDR with digital prescriptions.
- **Home Screen**: Dynamic interactive hero banner with micro-animations guiding users to start their first consultation.

### 6. Smart Back Navigation & Header Standardization
- **Pattern**: Every inner screen receives an explicit header back arrow (`⬅️` / `➡️` mirroring RTL/LTR).
- **Hardware Support**: Android hardware `BackHandler` configured to step back to home tab before app exit.

### 7. Comprehensive Patient Dental Record (EDR)
- **Module 1 - Medical Health Profile**: Allergies, diabetes, hypertension, bleeding disorders, and drug sensitivities.
- **Module 2 - Prescriptions Archive**: Auto-saved Rx history with instant A4/A5 PDF generation, WhatsApp sharing, and printing.
- **Module 3 - Diagnostic X-Rays & Scans**: Panorama/periapical image viewer with pinch-to-zoom modal.
- **Module 4 - Before/After Smile Transformation**: Interactive split-slider comparing baseline vs. completed treatment cases.
- **Security & Transfer Matrix**:
  - Patients: Read-write personal info and initial health history.
  - Doctors: Append-only clinical notes, diagnoses, and prescriptions.
  - Doctor Switching: Full read-only historical transfer to newly consulted doctors; previous doctor records remain tamper-proof.

### 8. Authentication Architecture (Google One-Tap + Zero-Cost Phone Linking + Doctor Credentialing)
- **Patient Auth**:
  - One-tap Google Sign-In via `@react-native-google-signin/google-signin` and Supabase Google OAuth.
  - **Zero-Cost Phone Capture**: On first Google login, prompt: *"Welcome to Asnanji! Enter your phone number for clinic appointments 📱"*. Number is saved directly to `profiles.phone` without expensive SMS gateway charges.
- **Doctor Verification Flow**:
  1. Professional application modal capturing: Full name, specialty, degree, syndicate ID, clinic address, and fee.
  2. Applications stored in `doctor_applications`.
  3. Super Admin one-click approval activates doctor account and sends automated welcome dispatch.

### 9. Super Admin Governance & Clinic Receptionist Hierarchy
- **Super Admin (`role = 'admin'`)**: System-wide doctor verification, clinic audits, metrics, and fee governance.
- **Clinic Receptionists (`role = 'assistant'`)**:
  - Doctors can provision up to 2 receptionist accounts (`clinic_doctor_id = current_doctor.id`).
  - Strict permissions: Manage calendar, confirm arrivals, coordinate slots.
  - Strictly blocked from: Writing diagnoses, issuing prescriptions, modifying medical records, or viewing other clinics' data.

---

## 🚀 Future Platform Capabilities (Phases 3 & 4)

1. **Push Notifications 🔔**:
   - Background push notifications via `expo-notifications` for new appointments, chat messages, and diagnosis releases.
2. **Offline-First Resilience 📶**:
   - Queue clinic actions via `@react-native-community/netinfo` + `AsyncStorage` when connectivity drops.
3. **Automated WebP Image Compression 🖼️**:
   - Client-side pre-compression via `expo-image-manipulator` to cut payload sizes by 80%.
4. **Care & Recall Automation ⏰**:
   - Post-treatment 24h follow-ups and 6-month preventive checkup reminders.

---

## 🏗️ 4-Phase Implementation Roadmap

```
┌────────────────────────────────────────────────────────────────────────┐
│  Phase 1: Core Foundation & Auth Hierarchy                             │
│  - Google One-Tap + Phone Linking prompt + Doctor Application Flow     │
│  - Super Admin verification dashboard + Clinic Assistant Role (2 slots)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│  Phase 2: Visual Polish, Branding & Anatomical 3D Model                │
│  - Official 3D Logo rollout + Splash & Adaptive Icon (1024x1024)       │
│  - Realistic 3D Dental Arch (1-32 teeth) with Clean UTF-8 Hotspots     │
│  - Header Back Buttons + Android Hardware BackHandler + Onboarding Hero│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│  Phase 3: Clinical Records, EDR & Smart PDF Prescriptions              │
│  - Comprehensive EDR Screen (Allergies, Rx archive, X-Ray gallery)     │
│  - Branded PDF Prescription Generator (Print & WhatsApp share)         │
│  - Interactive Before/After smile comparison slider                    │
│  - Multi-Doctor record transfer and permission enforcement             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│  Phase 4: Platform Performance & Production Readiness                  │
│  - Background Push Notifications (`expo-notifications`)                │
│  - Silent client-side WebP compression (`expo-image-manipulator`)      │
│  - Offline sync action queue for clinic appointments                   │
│  - EAS production build & release configuration                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Detailed Task Breakdown by Phase

| Phase | Core Deliverables | Target Files |
| :--- | :--- | :--- |
| **Phase 1: Auth & Hierarchy** | 1. Implement Google One-Tap sign-in with fallback.<br>2. Build instant post-auth Phone Number Link modal.<br>3. Create Doctor Application form and `doctor_applications` table.<br>4. Super Admin verification tab to activate doctors.<br>5. Doctor Settings: Add up to 2 receptionist accounts (`role = 'assistant'`). | `src/screens/AuthScreen.tsx`<br>`src/services/supabase.ts`<br>`src/context/AppContext.tsx`<br>`supabase/schema.sql`<br>`src/screens/doctor/DoctorSettingsScreen.tsx` |
| **Phase 2: UI & Dental Model** | 1. Generate app icon, adaptive icon, and splash from `new_official_logo.png`.<br>2. Replace block dental chart with realistic 3D model (`dental_model_reference.jpg`).<br>3. Clean all Arabic UTF-8 mojibake labels.<br>4. Add universal header Back Arrow ⬅️ on all inner screens.<br>5. Build 3-slide animated Onboarding flow + Home hero banner. | `assets/*`<br>`app.json`<br>`src/components/DentalChart.tsx`<br>`App.tsx`<br>`src/screens/HomeScreen.tsx` |
| **Phase 3: EDR & Prescriptions** | 1. Upgrade `MedicalRecordsScreen.tsx` into 4-part EDR.<br>2. Implement Allergies & Chronic Conditions card.<br>3. Build PDF Prescription generator (`expo-print`, `expo-sharing`).<br>4. Pinch-to-zoom X-ray and scan gallery.<br>5. Before/After transformation slider with touch gestures.<br>6. Apply multi-doctor read-only record sharing rules. | `src/screens/MedicalRecordsScreen.tsx`<br>`src/screens/DoctorConsultationDetailScreen.tsx`<br>`src/components/BeforeAfterSlider.tsx`<br>`src/types/index.ts` |
| **Phase 4: Notifications & Performance** | 1. Configure Expo Push Notifications token registration.<br>2. Implement WebP silent compression in image upload pipeline.<br>3. Offline queue for receptionist appointment management.<br>4. Scheduled follow-up and recall push notifications. | `src/services/supabaseStorage.ts`<br>`src/services/notifications.ts`<br>`src/services/offlineSync.ts` |