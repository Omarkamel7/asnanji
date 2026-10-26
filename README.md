# 🦷 اسنانجي (Asnanji) — Enterprise Multi-Doctor Dental Platform

[![React Native](https://img.shields.io/badge/React%20Native-0.76.7-blue.svg?logo=react&logoColor=white)](https://reactnative.dev)
[![Expo SDK](https://img.shields.io/badge/Expo%20SDK-52.0-black.svg?logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase%20PostgreSQL-3ECF8E.svg?logo=supabase&logoColor=white)](https://supabase.com)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-green.svg)]()
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

> **منصة الرعاية الصحية السنية المتكاملة متعددة الأطباء**  
> استشارات فورية عن بعد، فحص ثلاثي الأبعاد للأسنان والفك، حجز مواعيد العيادة مع منع التضارب، وإدارة العيادات للأطباء والسكرتارية والمديرين.

---

## 🏛️ بنية المشروع وهندسة النظام (Architecture & Design)

تم تصميم وبناء التطبيق وفق مبادئ **الهندسة البرمجية النظيفة (Clean Code & Enterprise Architecture)** لضمان القابلية للتوسع (Scalability)، الأمان الطبي (HIPAA/GDPR compliance readiness)، والأداء العالي في الزمن الحقيقي:

```
f:\karim abo bakr
├── 📁 assets/                     # الأصول الثابتة (شعار المنصة، المجسم التشريحي، الأيقونات)
├── 📁 builds/                     # حزم التطبيق التراكمية (APKs & AABs للأندرويد)
│   ├── asnanji-v1.0.0.apk
│   ├── asnanji-v1.1.0.apk
│   ├── asnanji-v1.2.0.apk
│   └── asnanji-v1.4.0.apk
├── 📁 credentials/                # مفاتيح ومصادقات الخدمات الخارجية (Ignored via .gitignore)
├── 📁 docs/                       # التوثيق الشامل ومخططات التطوير
│   ├── 📁 audit/                  # تقارير فحص الجودة والأمان (Code Audit Reports)
│   ├── 📁 credentials/            # تراخيص مزاولة المهنة والشهادات الرسمية
│   ├── 📁 plans/                  # خطط الإصدارات وتاريخ التحديثات
│   └── 📁 previews/               # نماذج المعاينة السريعة
├── 📁 scripts/                    # سكربتات الصيانة والتشغيل الآلي
├── 📁 src/                        # الشيفرة المصدرية الأساسية (Core Application Source)
│   ├── 📁 components/             # المكونات المشتركة القابلة لإعادة الاستخدام
│   │   ├── AudioRecorder.tsx      # مسجل الملاحظات الصوتية في الاستشارات
│   │   ├── DentalChart.tsx        # مجسم الفك التشريحي التفاعلي (1-32)
│   │   ├── ErrorBoundary.tsx      # صمام الأمان لمعالجة الأخطاء غير المتوقعة
│   │   ├── QuickAuthModal.tsx     # نافذة تسجيل الدخول السريعة الذكية
│   │   ├── UpdateNotifierModal.tsx# إشعار التحديثات الرسمية الهادئ
│   │   └── WebPhoneFrame.tsx      # إطار معاينة الجوال على المتصفح
│   ├── 📁 context/                # إدارة الحالة العامة (AppContext & State Providers)
│   ├── 📁 navigation/             # التنقل والمسارات والروابط العميقة (React Navigation)
│   ├── 📁 screens/                # شاشات التطبيق لجميع الأدوار
│   │   ├── 📁 admin/              # لوحة تحكم المدير العام (Doctor Approval, Analytics)
│   │   ├── AppointmentsScreen.tsx # إدارة وحجز المواعيد
│   │   ├── ChatScreen.tsx         # المحادثة الطبية اللحظية مع الطبيب
│   │   ├── DoctorDashboardScreen  # لوحة تحكم الطبيب والفرز الطبي
│   │   ├── DoctorPendingScreen    # شاشة الطبيب بانتظار الاعتماد والتدقيق
│   │   ├── HomeScreen.tsx         # الشاشة الرئيسية ودليل الأطباء
│   │   └── ProfileScreen.tsx      # الملف الشخصي وإعدادات الحساب
│   ├── 📁 services/               # الطبقات الخدمية والاتصال الخارجي
│   │   ├── notifications.ts       # محرك الإشعارات الفورية (Expo Push Service)
│   │   ├── supabase.ts            # تهيئة عميل Supabase
│   │   ├── supabaseStorage.ts     # رفع ومعالجة الوسائط والأشعة
│   │   └── versionControl.ts      # إدارة إصدارات التطبيق والتحقق من التحديثات
│   └── 📁 types/                  # تعريفات الأنواع الصارمة (TypeScript Type Definitions)
├── 📁 supabase/                   # ملفات البنية التحتية وقواعد البيانات
│   └── 📁 migrations/             # ترحيلات SQL وسياسات الأمان (Row Level Security)
├── 📄 app.json                    # إعدادات وصلاحيات Expo & Store Metadata
├── 📄 eas.json                    # إعدادات EAS Build للإنتاج
└── 📄 package.json                # التبعيات وحزم النظام
```

---

## 👥 منظومة الأدوار الخمسة (5-Persona Security Matrix)

النظام مبني على تفويض صلاحيات صارم بقواعد أمان **Row Level Security (RLS)**:

| الدور (Persona) | الصلاحيات والمسؤوليات | الشاشات المخصصة |
| :--- | :--- | :--- |
| **المريض (Patient)** | تصفح الأطباء، الفحص عبر مجسم الفك التفاعلي، طلب استشارة عن بعد، محادثة صوتية ونصية، وحجز مواعيد العيادة. | `HomeScreen`, `ComplaintIntake`, `AppointmentsScreen`, `ChatScreen` |
| **طبيب معتمد (Approved Doctor)** | استقبال الاستشارات، فحص الأشعة والصور، إرسال التشخيص الطبي، إدارة جدول مواعيد العيادة، وتحديد أسعار الخدمات. | `DoctorDashboardScreen`, `DoctorConsultationDetail`, `AppointmentsScreen` |
| **طبيب قيد المراجعة (Pending Doctor)** | متابعة حالة تدقيق ترخيص مزاولة المهنة ورقم القيد، مع إمكانية التواصل المباشر مع الدعم الفني. | `DoctorPendingScreen` |
| **مساعد العيادة (Clinic Assistant)** | تنظيم طابور المواعيد اليومي، تأكيد حضور المرضى، وإتمام الكشف، بدون صلاحية تعديل التشخيص الطبي. | `AssistantAppointmentsScreen`, `AppointmentsScreen` |
| **المدير العام (Super Admin)** | التدقيق الجنائي لتراخيص الأطباء وشهادات النقابة، قبول أو رفض الأطباء مع التعليل، ومتابعة إحصائيات المنصة. | `AdminDashboardScreen`, `AdminDoctorApplicationsScreen`, `AdminDoctorsListScreen` |

---

## ⚡ الميزات التقنية الجوهرية (Core Engineering Features)

### 1. 🔔 محرك الإشعارات الفورية (Expo Push Notification Engine)
- تكامل مباشر مع **Expo Push API Server** لتوصيل الإشعارات للأجهزة حتى عند إغلاق التطبيق.
- تنبيه فوري للأطباء عند ورود استشارة جديدة أو حجز موعد جديد.
- تنبيه فوري للمرضى عند رد الطبيب في المحادثة أو إرسال التشخيص أو تحديث حالة الموعد.
- تخزين آمن لرموز `Push Tokens` لكل جهاز في جدول `profiles`.

### 2. 🦷 مجسم الفك والأسنان التشريحي (Interactive Dental Chart)
- تمثيل دقيق لترقيم الأسنان العالمي (1 إلى 32).
- واجهة فحص تفاعلية تدعم التكبير لكامل الشاشة (Full-screen inspection mode) دون تشويه بصري.
- ربط موضع السن المصاب مباشرة ببيانات الاستشارة وقاعدة البيانات.

### 3. 💬 المحادثة الطبية اللحظية والوسائط (Real-time Medical Triage)
- قنوات **Supabase Realtime WebSockets** لمزامنة الرسائل والصوتيات والصور بدون أي تأخير.
- مسجل صوتي مدمج مع تشفير ومعالجة الرفع السحابي إلى حاويات Supabase Storage المحمية.

### 4. 🛡️ منع الحجز المزدوج (Double Booking Prevention)
- قيد سلامة فريد في قاعدة البيانات يمنع تضارب المواعيد لنفس الطبيب في نفس الساعة.

### 5. 🔄 نظام التحديثات الذكي (Over-The-Air & In-App Updates)
- فحص دوري لإصدار التطبيق عبر جدول `app_versions`.
- نافذة إشعار أنيقة وموجزة لا تزعج المستخدم إذا كان يعمل على أحدث إصدار.

---

## 🚀 التثبيت والتشغيل المحلي (Setup & Development)

### المتطلبات الأساسية
- **Node.js** >= 18.0.0
- **npm** أو **yarn**
- **Expo CLI** (`npm install -g expo-cli`)

### خطوات التثبيت

1. **استنساخ المشروع وتثبيت الحزم:**
```bash
git clone <repository-url>
cd "karim abo bakr"
npm install
```

2. **ضبط المتغيرات البيئية (`.env`):**
قم بإنشاء ملف `.env` في المسار الجذري بالبيانات التالية:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. **تشغيل خادم التطوير:**
```bash
# تشغيل خادم Metro للجوال
npx expo start

# تشغيل خادم Metro للويب مباشرة
npx expo start --web
```

---

## 📱 بناء التطبيق للإنتاج (EAS Build Commands)

المشروع مهيأ بالكامل للنشر على متجر Google Play ومتجر Apple App Store عبر EAS:

```bash
# بناء حزمة أندرويد APK للتجربة المباشرة
eas build --platform android --profile preview

# بناء حزمة أندرويد AAB الرسمية للنشر على Google Play
eas build --platform android --profile production

# بناء نسخة iOS
eas build --platform ios --profile production
```

---

## 🔒 الأمان وحماية البيانات الطبية (Security & Privacy)

- **Row Level Security (RLS):** كافة الجداول الحساسة (`consultations`, `messages`, `appointments`, `doctor_applications`) محمية بسياسات RLS صارمة.
- **تشفير الاتصال:** جميع العمليات وقنوات Realtime تتم عبر HTTPS و WSS مشفرة.
- **عزل الملفات السرية:** ملفات الاعتماد (`credentials/`) والمفاتيح مفصولة تماماً عن تتبع Git.

---

**© 2026 Asnanji Healthcare Platform. All Rights Reserved.**
