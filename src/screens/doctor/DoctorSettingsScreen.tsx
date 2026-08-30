import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  User,
  Phone,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Sparkles,
  Layers,
  Image as ImageIcon,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../services/supabase';

const ALL_DAYS = [
  { key: 'Saturday', labelAr: 'السبت', labelEn: 'Saturday' },
  { key: 'Sunday', labelAr: 'الأحد', labelEn: 'Sunday' },
  { key: 'Monday', labelAr: 'الإثنين', labelEn: 'Monday' },
  { key: 'Tuesday', labelAr: 'الثلاثاء', labelEn: 'Tuesday' },
  { key: 'Wednesday', labelAr: 'الأربعاء', labelEn: 'Wednesday' },
  { key: 'Thursday', labelAr: 'الخميس', labelEn: 'Thursday' },
  { key: 'Friday', labelAr: 'الجمعة', labelEn: 'Friday' },
];

export const DoctorSettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { currentUser, language, isRTL, updateUserProfile, refreshClinicData } = useApp();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile Details
  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [specialty, setSpecialty] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [consultationFee, setConsultationFee] = useState('350');

  // Schedule & Working Days
  const [workingDays, setWorkingDays] = useState<string[]>([
    'Saturday',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
  ]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('22:00');

  // Feature & Visibility Toggles
  const [isPubliclyVisible, setIsPubliclyVisible] = useState(true);
  const [enableInstantConsultation, setEnableInstantConsultation] = useState(true);
  const [enableBooking, setEnableBooking] = useState(true);
  const [enableChat, setEnableChat] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch from doctor_profiles
      const { data: profileData } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileData) {
        setBio(profileData.bio || '');
        setSpecialty(profileData.specialty || 'استشاري طب وجراحة الأسنان');
        setTitle(profileData.title || 'استشاري طب وجراحة الأسنان');
        setClinicAddress(profileData.clinic_address || 'القاهرة، مصر');
        setConsultationFee(profileData.consultation_fee?.toString() || '400');
        if (profileData.is_accepting_patients !== undefined) {
          setIsPubliclyVisible(profileData.is_accepting_patients);
        }
      } else {
        // Auto-initialize for new doctor
        await supabase.from('doctor_profiles').upsert({
          id: currentUser.id,
          slug: currentUser.id,
          specialty: 'استشاري تقويم وتجميل الأسنان',
          bio: 'طبيب أسنان معتمد على منصة اسنانجي لتقديم أرقى خدمات الرعاية وتجميل الأسنان.',
          clinic_address: 'القاهرة، مصر',
          consultation_fee: 400,
          is_accepting_patients: true,
          rating: 5.0,
          updated_at: new Date().toISOString()
        });
        setSpecialty('استشاري تقويم وتجميل الأسنان');
        setConsultationFee('400');
      }

      // 2. Fetch from doctor_settings
      const { data: settingsData } = await supabase
        .from('doctor_settings')
        .select('*')
        .eq('doctor_id', currentUser.id)
        .single();

      if (settingsData) {
        setEnableInstantConsultation(settingsData.enable_instant_consultation ?? true);
        setEnableBooking(settingsData.enable_booking ?? true);
        setEnableChat(settingsData.enable_chat ?? true);
        if (settingsData.working_days) setWorkingDays(settingsData.working_days);
        if (settingsData.working_hours_start) setStartTime(settingsData.working_hours_start);
        if (settingsData.working_hours_end) setEndTime(settingsData.working_hours_end);
      }
    } catch (e) {
      console.warn('Error fetching doctor settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayKey: string) => {
    setWorkingDays((prev) =>
      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Update profiles table
      await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      await updateUserProfile({
        ...currentUser,
        fullName: fullName.trim(),
        phone: phone.trim(),
      });

      // 2. Update doctor_profiles table
      const profileUpdates = {
        id: currentUser.id,
        slug: currentUser.id,
        bio: bio.trim(),
        specialty: specialty.trim() || 'استشاري جراحة وتجميل الأسنان',
        title: title.trim() || 'استشاري طب وجراحة الأسنان',
        clinic_address: clinicAddress.trim() || 'القاهرة، مصر',
        consultation_fee: Number(consultationFee) || 350,
        is_accepting_patients: isPubliclyVisible,
        updated_at: new Date().toISOString(),
      };

      await supabase.from('doctor_profiles').upsert(profileUpdates);

      // 3. Update doctor_settings table
      const settingsUpdates = {
        doctor_id: currentUser.id,
        enable_instant_consultation: enableInstantConsultation,
        enable_booking: enableBooking,
        enable_chat: enableChat,
        working_days: workingDays,
        working_hours_start: startTime,
        working_hours_end: endTime,
        updated_at: new Date().toISOString(),
      };

      await supabase.from('doctor_settings').upsert(settingsUpdates);

      await refreshClinicData();

      Alert.alert(
        language === 'ar' ? 'تم الحفظ بنجاح 🎉' : 'Saved Successfully 🎉',
        language === 'ar'
          ? isPubliclyVisible
            ? 'تم حفظ التعديلات وإظهار حسابك في دليل الأطباء للمرضى!'
            : 'تم حفظ التعديلات وإخفاء حسابك من دليل الأطباء للمرضى!'
          : 'All clinic settings and visibility updated!'
      );
    } catch (err: any) {
      Alert.alert(
        language === 'ar' ? 'خطأ أثناء الحفظ' : 'Save Error',
        err?.message || (language === 'ar' ? 'يرجى المحاولة مرة أخرى' : 'Please try again')
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>
          {language === 'ar' ? 'جاري تحميل إعدادات العيادة...' : 'Loading clinic settings...'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            {isRTL ? (
              <ArrowRight size={20} color={Colors.white} />
            ) : (
              <ArrowLeft size={20} color={Colors.white} />
            )}
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              {language === 'ar' ? 'إعدادات وتوافر العيادة 🩺' : 'Clinic & Doctor Control 🩺'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {language === 'ar'
                ? 'تحكم شامل في كل ما يظهر للمرضى في حسابك وعيادتك'
                : 'Full control over your clinic and public visibility'}
            </Text>
          </View>
        </View>

        {/* Quick Hub Navigation Buttons */}
        <View style={styles.hubButtonsRow}>
          <TouchableOpacity
            style={styles.hubBtn}
            onPress={() => navigation.navigate('ManageServices')}
          >
            <Layers size={18} color={Colors.primaryDark} />
            <Text style={styles.hubBtnText}>
              {language === 'ar' ? 'الخدمات والأسعار' : 'Manage Services'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.hubBtn, { backgroundColor: '#f3e8ff' }]}
            onPress={() => navigation.navigate('ManagePortfolio')}
          >
            <ImageIcon size={18} color="#7e22ce" />
            <Text style={[styles.hubBtnText, { color: '#7e22ce' }]}>
              {language === 'ar' ? 'معرض صور الحالات' : 'Manage Portfolio'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Public Visibility Box */}
      <View style={[styles.sectionCard, styles.visibilityCard]}>
        <View style={styles.visibilityHeader}>
          {isPubliclyVisible ? (
            <Eye size={24} color="#16a34a" />
          ) : (
            <EyeOff size={24} color="#dc2626" />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.visibilityTitle}>
              {language === 'ar'
                ? 'إظهار الحساب في دليل الأطباء للمرضى'
                : 'Public Directory Visibility'}
            </Text>
            <Text style={styles.visibilitySub}>
              {isPubliclyVisible
                ? language === 'ar'
                  ? '🟢 حسابك ظاهر للجميع في الصفحة الرئيسية ويستقبل المرضى'
                  : '🟢 Your clinic is visible in patient search and receiving bookings'
                : language === 'ar'
                  ? '🔴 حسابك مخفي حالياً ولن يظهر للمرضى في البحث'
                  : '🔴 Your clinic is hidden from patient search'}
            </Text>
          </View>
          <Switch
            value={isPubliclyVisible}
            onValueChange={setIsPubliclyVisible}
            trackColor={{ false: Colors.border, true: '#16a34a' }}
          />
        </View>
      </View>

      {/* Section 1: Availability & Feature Toggles */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {language === 'ar' ? '1. التحكم في ميزات الحجز والاستشارة' : '1. Booking & Chat Features'}
        </Text>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>
              {language === 'ar' ? 'الاستشارات الفورية أونلاين' : 'Instant Consultations'}
            </Text>
            <Text style={styles.toggleSub}>
              {language === 'ar'
                ? 'السماح للمرضى بطلب تشخيص أولي أونلاين عبر التطبيق'
                : 'Allow patients to request online triage & consultation'}
            </Text>
          </View>
          <Switch
            value={enableInstantConsultation}
            onValueChange={setEnableInstantConsultation}
            trackColor={{ false: Colors.border, true: Colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>
              {language === 'ar' ? 'حجز المواعيد بالعيادة' : 'In-Clinic Bookings'}
            </Text>
            <Text style={styles.toggleSub}>
              {language === 'ar'
                ? 'إتاحة حجز الزيارات والكشوفات المباشرة في العيادة'
                : 'Allow patients to book physical visits to your clinic'}
            </Text>
          </View>
          <Switch
            value={enableBooking}
            onValueChange={setEnableBooking}
            trackColor={{ false: Colors.border, true: Colors.primary }}
          />
        </View>

        <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>
              {language === 'ar' ? 'المحادثات المباشرة (Live Chat)' : 'Direct Live Chat'}
            </Text>
            <Text style={styles.toggleSub}>
              {language === 'ar'
                ? 'تفعيل استقبال رسائل الشات والرسائل الصوتية من المرضى'
                : 'Enable direct messaging and voice notes with patients'}
            </Text>
          </View>
          <Switch
            value={enableChat}
            onValueChange={setEnableChat}
            trackColor={{ false: Colors.border, true: Colors.primary }}
          />
        </View>
      </View>

      {/* Section 2: Personal & Professional Profile */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {language === 'ar' ? '2. البيانات المهنية والبروفايل' : '2. Professional Profile'}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'ar' ? 'اسم الطبيب الكامل' : 'Doctor Full Name'}
          </Text>
          <View style={styles.inputBox}>
            <User size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.textInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="د. كريم أبو بكر"
              placeholderTextColor={Colors.textMuted}
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'ar' ? 'رقم الهاتف للتواصل / واتساب' : 'Phone / WhatsApp'}
          </Text>
          <View style={styles.inputBox}>
            <Phone size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="+20 100 000 0000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'ar' ? 'التخصص الدقيق' : 'Specialty'}
          </Text>
          <View style={styles.inputBox}>
            <Briefcase size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.textInput}
              value={specialty}
              onChangeText={setSpecialty}
              placeholder="استشاري جراحة وزراعة وتجميل الأسنان"
              placeholderTextColor={Colors.textMuted}
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'ar' ? 'سعر الكشف (ج.م)' : 'Consultation Fee (EGP)'}
          </Text>
          <View style={styles.inputBox}>
            <DollarSign size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.textInput}
              value={consultationFee}
              onChangeText={setConsultationFee}
              placeholder="350"
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'ar' ? 'عنوان وموقع العيادة' : 'Clinic Address'}
          </Text>
          <View style={styles.inputBox}>
            <MapPin size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.textInput}
              value={clinicAddress}
              onChangeText={setClinicAddress}
              placeholder="برج الأطباء، شارع النصر، المعادي، القاهرة"
              placeholderTextColor={Colors.textMuted}
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'ar' ? 'النبذة المهنية وسنوات الخبرة' : 'Professional Bio'}
          </Text>
          <TextInput
            style={styles.textArea}
            value={bio}
            onChangeText={setBio}
            placeholder="اكتب نبذة تعريفية بالخبرات والمؤهلات والشهادات التي تعرض للمرضى..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>
      </View>

      {/* Section 3: Schedule & Working Days */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {language === 'ar' ? '3. جدول وأيام العمل بالعيادة' : '3. Working Days & Schedule'}
        </Text>

        <Text style={styles.inputLabel}>
          {language === 'ar' ? 'اختر أيام العمل المتاحة للحجز:' : 'Select Available Working Days:'}
        </Text>

        <View style={styles.daysGrid}>
          {ALL_DAYS.map((day) => {
            const isSelected = workingDays.includes(day.key);
            return (
              <TouchableOpacity
                key={day.key}
                onPress={() => toggleDay(day.key)}
                style={[styles.dayPill, isSelected && styles.dayPillSelected]}
              >
                <View
                  style={[
                    styles.dayCheckbox,
                    isSelected && styles.dayCheckboxSelected,
                  ]}
                >
                  {isSelected && <Check size={12} color={Colors.white} />}
                </View>
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                  ]}
                >
                  {language === 'ar' ? day.labelAr : day.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.timeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>
              {language === 'ar' ? 'بداية العمل' : 'Start Time'}
            </Text>
            <View style={styles.inputBox}>
              <Clock size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.textInput}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="10:00"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>
              {language === 'ar' ? 'نهاية العمل' : 'End Time'}
            </Text>
            <View style={styles.inputBox}>
              <Clock size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.textInput}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="22:00"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <>
            <Save size={20} color={Colors.white} />
            <Text style={styles.saveBtnText}>
              {language === 'ar' ? 'حفظ جميع التعديلات' : 'Save All Changes'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    ...Shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  hubButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  hubBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  hubBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Shadows.sm,
  },
  visibilityCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
  },
  visibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visibilityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },
  visibilitySub: {
    fontSize: 11,
    color: '#15803d',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  toggleSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 14,
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    gap: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: Colors.background,
    fontSize: 13,
    color: Colors.textPrimary,
    minHeight: 85,
    textAlignVertical: 'top',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 14,
  },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    gap: 6,
  },
  dayPillSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  dayCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCheckboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayText: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  dayTextSelected: {
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    ...Shadows.md,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
