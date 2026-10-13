# 🦷 اسنانجي (Asnanji) - Multi-Doctor Dental Healthcare Platform

منصة أطباء الأسنان الذكية والمتخصصة للاستشارات الطبية عن بعد، حجز المواعيد، وإدارة العيادات (v1.0.0).

---

## 📥 تحميل وتثبيت التطبيق (Download App APK - النسخة الدائمة)

يمكنك تحميل ملف الـ APK المباشر والدائم لتثبيت وتجربة التطبيق على أي هاتف أندرويد (رابط دائم لا ينتهي أبداً):

| 📱 رابط التحميل المباشر والدائم (GitHub Release) | 🌐 صفحة الإصدار الرسمي | 📦 حجم الملف | 🏷️ الإصدار |
| :--- | :--- | :--- | :--- |
| [**⬇️ تحميل Asnanji APK مباشرة (رابط دائم)**](https://github.com/Omarkamel7/asnanji/releases/download/v1.0.0/asnanji-v1.0.0.apk) | [**📲 صفحة GitHub Release الرسمية**](https://github.com/Omarkamel7/asnanji/releases/tag/v1.0.0) | ~53.8 MB | `v1.0.0 (Build 2)` |

---

## 🚀 المميزات الرئيسية (Key Features)

- **دليل الأطباء (Doctor Directory)**: استعراض الأطباء المعتمدين، التخصصات، التقييمات، والأسعار مع فلاتر وبحث فوري.
- **نظام حسابات السكرتارية والمساعدين (Clinic Staff)**: إمكانية إنشاء حسابات سكرتارية لكل عيادة لإدارة المواعيد والرد على المرضى دون صلاحية كتابة التشخيص الطبي.
- **إحصائيات زيارات البروفايل (Profile Views Analytics)**: تتبع عدد الزيارات الفعلية لكل طبيب وعرضها حصرياً في لوحة تحكمه الخاصة.
- **بروفايل الطبيب التفاعلي (Doctor Mini-Site)**: صفحة متكاملة لكل طبيب تشمل معرض الحالات (Before & After Slider)، الأسعار، ومواعيد العمل.
- **استشارات فورية عن بعد (Online Triage & Consultations)**: إمكانية إرفاق صور الأسنان والأشعة وتحديد مواضع الألم، مع محادثة مباشرة مع الطبيب.
- **منع الحجز المزدوج (Double Booking Prevention)**: نظام حجز متطور ومؤمن بقواعد بيانات Supabase يمنع تضارب المواعيد.
- **تنبيهات فورية ولحظية (Real-time Subscriptions)**: استماع لحظي للرسائل والاستشارات الجديدة عبر قنوات Supabase Realtime WebSockets.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

- **Frontend**: React Native (v0.76), Expo (SDK 52), TypeScript, React Navigation
- **Backend & Database**: Supabase (PostgreSQL with RLS, Realtime Channels, Storage Buckets)
- **State Management**: React Context API + AsyncStorage

---

## 📦 التثبيت والتشغيل المحلي (Getting Started)

```bash
# تثبيت الحزم
npm install

# تشغيل التطبيق في وضع التطوير
npx expo start
```

---
Built with ❤️ for Modern Dental Healthcare.