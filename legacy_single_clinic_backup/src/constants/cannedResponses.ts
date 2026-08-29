export interface CannedResponse {
  id: string;
  category: 'medication' | 'instructions' | 'appointment' | 'general';
  titleAr: string;
  titleEn: string;
  textAr: string;
  textEn: string;
}

export const CANNED_RESPONSES: CannedResponse[] = [
  {
    id: 'pain_relief',
    category: 'medication',
    titleAr: '💊 مسكن ألم مؤقت',
    titleEn: '💊 Temporary Pain Relief',
    textAr: 'أهلاً بك، لتسكين الألم مؤقتاً لحين الكشف بالعيادة، يمكنك تناول بروفين 400 ملجم بعد الأكل عند اللزوم (تأكد من عدم وجود مشاكل بالمعدة أو حساسية)، مع تجنب المشروبات الباردة والساخنة تماماً.',
    textEn: 'Hello, for temporary pain relief before clinic examination, you can take Ibuprofen 400mg after meals as needed (if you have no stomach issues or allergies), and strictly avoid extreme hot or cold drinks.',
  },
  {
    id: 'after_extraction',
    category: 'instructions',
    titleAr: '🩹 تعليمات ما بعد الخلع',
    titleEn: '🩹 Post-Extraction Care',
    textAr: 'تعليمات هامة: استمر بالضغط على الشاش لمدة 45 دقيقة، لا تبصق أو تمضمض اليوم نهائياً، تجنب التدخين والمشروبات الساخنة لمدة 24 ساعة، وتناول الأطعمة اللينة والباردة.',
    textEn: 'Important instructions: Keep biting on the gauze for 45 minutes, do not spit or rinse today, strictly avoid smoking and hot drinks for 24h, and eat soft cool foods.',
  },
  {
    id: 'need_xray',
    category: 'general',
    titleAr: '📸 طلب أشعة بانوراما',
    titleEn: '📸 Panoramic X-Ray Needed',
    textAr: 'لتقييم الحالة وتحديد خطة العلاج الدقيقة بدقة 100%، يرجى إجراء أشعة بانوراما رقمية حديثة وإرفاق صورتها هنا أو إحضارها معك أثناء الزيارة.',
    textEn: 'For accurate diagnosis and treatment planning, please take a recent panoramic dental X-ray and attach it here or bring it with you during your visit.',
  },
  {
    id: 'urgent_visit',
    category: 'appointment',
    titleAr: '🚨 حجز كشف عاجل',
    titleEn: '🚨 Urgent Clinic Visit',
    textAr: 'الحالة تستدعي تدخلاً علاجياً عاجلاً بالعيادة لإنقاذ السن وتسكين العصب. يمكنك حجز أقرب موعد متاح الآن عبر تبويب حجز المواعيد بالتطبيق.',
    textEn: 'This case requires urgent clinic intervention to save the tooth and relieve nerve pain. Please book the earliest available slot via the Appointments tab in the app.',
  },
];
