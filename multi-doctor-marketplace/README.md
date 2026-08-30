# Smart Dental Clinic

[![Download APK](https://img.shields.io/badge/Download-Android%20APK%20v1.4.0-0284c7?style=for-the-badge&logo=android)](https://expo.dev/accounts/omarsala7s-team/projects/smart-dental-clinic/builds/334ff61d-f1ef-4ba0-a2a3-1fcaf5176280)

> 📲 **Latest Android APK (v1.4.0)**: [Click here to download & install](https://expo.dev/accounts/omarsala7s-team/projects/smart-dental-clinic/builds/334ff61d-f1ef-4ba0-a2a3-1fcaf5176280)

Smart Dental Clinic is an advanced cross-platform dental telemedicine and clinic management application built with React Native and Expo. It provides interactive dental triage, patient-doctor communication channels, appointment workflows, and a clinic administration portal backed by Supabase.

---

## Key Features

### Patient Experience
- **Interactive Dental Mapping**: Visual arch selector allowing patients to pinpoint affected teeth, identify symptoms, and rate pain severity.
- **Tele-Dentistry Consultation**: Multimodal complaint intake supporting voice notes, clinical photography, and radiographic image attachments.
- **Real-Time Doctor Messaging**: Direct messaging channel with the consultant dental surgeon for preliminary evaluations and follow-ups.
- **Bilingual Interface**: Seamless runtime switching between Arabic and English with full RTL (Right-to-Left) and LTR layout adaptations.

### Clinical & Administrative Portal
- **Consultation Triage Dashboard**: Centralized review interface for incoming patient cases, medical history alerts, and triage reports.
- **Intake Form Customization**: Granular control for clinicians to toggle active symptom options, pain thresholds, and health alert categories.
- **Dynamic Clinic Management**: In-app management of operating hours, clinic contact metadata, location details, and promotional service badges.
- **Portfolio & Case Management**: Before-and-after procedural showcase with direct image uploads.

---

## Technical Architecture

| Layer | Technology |
| :--- | :--- |
| **Framework** | React Native 0.76, Expo SDK 52 |
| **Language** | TypeScript 5.3 |
| **Backend & Database** | Supabase (PostgreSQL, Row-Level Security, Realtime Subscriptions, Object Storage, Auth) |
| **Navigation** | React Navigation (Native Stack & Bottom Tabs) |
| **Audio & Media** | Expo AV, Expo Image Picker |
| **Vector Icons** | Lucide React Native |
| **Distribution & Updates** | EAS Build (Android APK / AAB, iOS) and EAS Update (Over-The-Air) |

---

## Getting Started

### Prerequisites
- Node.js LTS (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI for builds (`npm install -g eas-cli`)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Omarkamel7/smart-dental-clinic.git
   cd smart-dental-clinic
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npx expo start
   ```

---

## Standalone Builds & Distribution

### Android APK Build
To generate a standalone Android APK via EAS Build:
```bash
eas build --platform android --profile preview
```

### Over-The-Air (OTA) Updates
To publish live runtime updates to installed applications without requiring binary reinstallation:
```bash
eas update --auto
```

---

## Releases & Downloads

Pre-built application binaries and version changelogs are available on the [GitHub Releases](https://github.com/Omarkamel7/smart-dental-clinic/releases) page.

---

## License

Proprietary. All rights reserved. Dr. Karim Abo Bakr Dental Center.
