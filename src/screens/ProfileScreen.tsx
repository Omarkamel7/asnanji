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
import {
  User,
  Globe,
  UserCheck,
  Shield,
  Phone,
  Heart,
  Save,
  LogOut,
  Info,
  Sparkles,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { CLINIC_INFO } from '../constants/dentalData';
import {
  checkForAppUpdates,
  openApkDownload,
  applyOtaUpdate,
  APP_VERSION_DATA,
} from '../services/versionControl';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    t,
    language,
    setLanguage,
    role,
    setRole,
    currentUser,
    updateUserProfile,
    clinicSettings,
    signOut,
    isAuthenticated,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.fullName ?? '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [hasDiabetes, setHasDiabetes] = useState(
    currentUser?.medicalHistory?.hasDiabetes ?? false
  );
  const [hasHypertension, setHasHypertension] = useState(
    currentUser?.medicalHistory?.hasHypertension ?? false
  );
  const [hasBleedingDisorder, setHasBleedingDisorder] = useState(false);
  const [hasPenicillinAllergy, setHasPenicillinAllergy] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const handleManualCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const result = await checkForAppUpdates();
      if (result.hasUpdate) {
        Alert.alert(
          language === 'ar' ? '🚀 يتوفر تحديث جديد!' : '🚀 New Update Available!',
          language === 'ar'
            ? `الإصدار الجديد: v${result.version}\n\n${result.releaseNotesAr}`
            : `New Version: v${result.version}\n\n${result.releaseNotesEn}`,
          [
            {
              text: language === 'ar' ? 'تنزيل APK مباشر' : 'Download APK',
              onPress: () => openApkDownload(result.apkDownloadUrl),
            },
            result.hasOtaUpdate
              ? {
                  text: language === 'ar' ? 'تحديث فوري' : 'Instant Update',
                  onPress: () => applyOtaUpdate(),
                }
              : {
                  text: language === 'ar' ? 'إلغاء' : 'Cancel',
                  style: 'cancel',
                },
          ]
        );
      } else {
        Alert.alert(
          language === 'ar' ? '✓ التطبيق محدث' : '✓ Up to Date',
          language === 'ar'
            ? `أنت تستخدم أحدث إصدار معتمد v${APP_VERSION_DATA.version}. متصل بنجاح مع Supabase و GitHub.`
            : `You are on the latest version v${APP_VERSION_DATA.version}. Connected to Supabase & GitHub.`
        );
      }
    } catch (e: any) {
      Alert.alert(
        language === 'ar' ? 'حالة التحديث' : 'Update Status',
        language === 'ar' ? 'اكتمل فحص التحديثات.' : 'Update check completed.'
      );
    } finally {
      setCheckingUpdate(false);
    }
  };

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName ?? '');
      setPhone(currentUser.phone ?? '');
      setHasDiabetes(currentUser.medicalHistory?.hasDiabetes ?? false);
      setHasHypertension(currentUser.medicalHistory?.hasHypertension ?? false);
      setHasPenicillinAllergy(
        currentUser.medicalHistory?.hasPenicillinAllergy ?? false
      );
    }
  }, [currentUser]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateUserProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        medicalHistory: {
          ...currentUser.medicalHistory,
          hasDiabetes,
          hasHypertension,
          hasPenicillinAllergy,
        },
      });

      Alert.alert(
        language === 'ar' ? 'تم الحفظ' : 'Saved',
        language === 'ar'
          ? 'تم تحديث الملف الطبي بنجاح.'
          : 'Profile updated successfully.'
      );
    } catch (err: any) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        err?.message || (language === 'ar' ? 'تعذر حفظ البيانات' : 'Failed to save profile')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateAuth = (initialMode: 'signin' | 'signup' = 'signin', openDoctorModal = false) => {
    try {
      if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate('Auth', { initialMode, openDoctorModal });
      } else {
        console.warn('Navigation to Auth unavailable');
      }
    } catch (err) {
      console.warn('Navigation to Auth error:', err);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Guest Welcome & Auth Card (When Not Logged In) */}
      {!isAuthenticated && (
        <View style={styles.guestCard}>
          <View style={styles.guestHeader}>
            <View style={styles.guestIconCircle}>
              <User size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guestTitle}>
                {language === 'ar' ? 'مرحباً بك في أسنانجي 🦷✨' : 'Welcome to Asnanji 🦷✨'}
              </Text>
              <Text style={styles.guestSubtitle}>
                {language === 'ar'
                  ? 'سجل دخولك أو أنشئ حسابك للوصول إلى استشاراتك الطبية وسجلاتك وحجز المواعيد'
                  : 'Sign in or create an account to view medical consultations and bookings'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.guestActionBtnPrimary}
            onPress={() => handleNavigateAuth('signin')}
          >
            <Text style={styles.guestActionBtnPrimaryText}>
              {language === 'ar' ? '🔑 تسجيل الدخول' : '🔑 Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestActionBtnSecondary}
            onPress={() => handleNavigateAuth('signup')}
          >
            <Text style={styles.guestActionBtnSecondaryText}>
              {language === 'ar' ? '✨ إنشاء حساب مريض جديد' : '✨ Create New Patient Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestDoctorBtn}
            onPress={() => handleNavigateAuth('signin', true)}
          >
            <Text style={styles.guestDoctorBtnText}>
              {language === 'ar' ? '👨‍⚕️ انضم إلى شبكة الأطباء المعتمدين' : '👨‍⚕️ Join as Verified Dentist'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Doctor Management Options (Only shown when logged in as Doctor) */}
      {role === 'doctor' && (
        <View style={styles.roleCard}>
          <View style={styles.roleHeader}>
            <Shield size={20} color={Colors.primaryDark} />
            <Text style={styles.roleTitle}>
              {language === 'ar' ? 'حساب الطبيب المعتمد:' : 'Doctor Account:'}
            </Text>
            <Text style={styles.roleBadge}>
              {currentUser.fullName || (language === 'ar' ? 'طبيب معتمد' : 'Verified Doctor')}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.doctorToolBtn}
            onPress={() => navigation?.navigate('DoctorSettings')}
          >
            <Text style={styles.doctorToolBtnText}>
              {language === 'ar' ? '✏️ تعديل بيانات العيادة والطبيب' : '✏️ Edit Clinic & Doctor Info'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doctorToolBtn}
            onPress={() => navigation?.navigate('ManageServices')}
          >
            <Text style={styles.doctorToolBtnText}>
              {language === 'ar' ? '💲 إدارة الخدمات والأسعار' : '💲 Manage Services & Prices'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doctorToolBtn}
            onPress={() => navigation?.navigate('ManagePortfolio')}
          >
            <Text style={styles.doctorToolBtnText}>
              {language === 'ar' ? '🖼️ إدارة معرض الأعمال (قبل/بعد)' : '🖼️ Manage Portfolio (Before/After)'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Language Setting Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Globe size={18} color={Colors.primary} />
          <Text style={styles.cardTitle}>
            {language === 'ar' ? 'لغة التطبيق (Language)' : 'App Language'}
          </Text>
        </View>

        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langChip, language === 'ar' && styles.langChipActive]}
            onPress={() => setLanguage('ar')}
          >
            <Text
              style={[
                styles.langChipText,
                language === 'ar' && styles.langChipTextActive,
              ]}
            >
              العربية (RTL)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langChip, language === 'en' && styles.langChipActive]}
            onPress={() => setLanguage('en')}
          >
            <Text
              style={[
                styles.langChipText,
                language === 'en' && styles.langChipTextActive,
              ]}
            >
              English (LTR)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Personal Info, Health History & Sign Out (Only when logged in) */}
      {isAuthenticated && (
        <>
          {/* Personal Info */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <User size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>
                {language === 'ar' ? 'البيانات الشخصية' : 'Personal Information'}
              </Text>
            </View>

            <Text style={styles.fieldLabel}>
              {language === 'ar' ? 'الاسم الكامل:' : 'Full Name:'}
            </Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder={language === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
              textAlign={language === 'ar' ? 'right' : 'left'}
            />

            <Text style={styles.fieldLabel}>
              {language === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}
            </Text>
            <TextInput
              style={[styles.input, { writingDirection: 'ltr' }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="01xxxxxxxxx"
              keyboardType="phone-pad"
              textAlign={language === 'ar' ? 'right' : 'left'}
            />
          </View>

          {/* Health History Switches */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Heart size={18} color={Colors.emergency} />
              <Text style={styles.cardTitle}>
                {language === 'ar'
                  ? 'التاريخ الطبي للأمراض المزمنة'
                  : 'Medical Health Background'}
              </Text>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t?.diabetes ?? 'السكري'}</Text>
              <Switch
                value={hasDiabetes}
                onValueChange={setHasDiabetes}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t?.hypertension ?? 'ضغط الدم'}</Text>
              <Switch
                value={hasHypertension}
                onValueChange={setHasHypertension}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                {t?.penicillinAllergy ?? 'حساسية البنسلين'}
              </Text>
              <Switch
                value={hasPenicillinAllergy}
                onValueChange={setHasPenicillinAllergy}
                trackColor={{ false: Colors.border, true: Colors.emergency }}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Save size={18} color={Colors.white} />
                <Text style={styles.saveBtnText}>{t?.save ?? 'حفظ التعديلات'}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Global Sign Out Button */}
          <TouchableOpacity
            style={styles.globalSignOutBtn}
            onPress={() => {
              Alert.alert(
                language === 'ar' ? 'تسجيل الخروج' : 'Sign Out',
                language === 'ar'
                  ? 'هل أنت متأكد من رغبتك في تسجيل الخروج من هذا الحساب؟'
                  : 'Are you sure you want to sign out?',
                [
                  { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
                  {
                    text: language === 'ar' ? 'تسجيل الخروج' : 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                      await signOut();
                      Alert.alert(
                        language === 'ar' ? 'تم تسجيل الخروج' : 'Signed Out',
                        language === 'ar' ? 'تم تسجيل خروجك بنجاح.' : 'Signed out successfully.'
                      );
                    },
                  },
                ]
              );
            }}
          >
            <LogOut size={18} color="#DC2626" />
            <Text style={styles.globalSignOutBtnText}>
              {language === 'ar' ? '🚪 تسجيل الخروج من الحساب' : '🚪 Sign Out of Account'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* App Version & Update Manager Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Sparkles size={18} color={Colors.primary} />
          <Text style={styles.cardTitle}>
            {language === 'ar' ? 'إصدار التطبيق والتحديثات' : 'App Version & Updates'}
          </Text>
        </View>

        <View style={styles.versionInfoRow}>
          <View>
            <Text style={styles.versionLabel}>
              {language === 'ar' ? 'الإصدار الحالي:' : 'Current Version:'}
            </Text>
            <Text style={styles.versionValue}>
              v{APP_VERSION_DATA.version} (Build {APP_VERSION_DATA.buildNumber})
            </Text>
          </View>
          <View style={styles.versionStatusBadge}>
            <Text style={styles.versionStatusText}>
              {language === 'ar' ? '✓ الأحدث' : '✓ Latest'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkUpdateBtn}
          onPress={handleManualCheckUpdate}
          disabled={checkingUpdate}
        >
          {checkingUpdate ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.checkUpdateBtnText}>
              {language === 'ar' ? '🔄 فحص وتحميل التحديثات' : '🔄 Check for Updates'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Doctor / Admin Portal Login Link (For Guests) */}
      {!isAuthenticated && (
        <TouchableOpacity
          style={styles.doctorPortalBtn}
          onPress={() => handleNavigateAuth('signin', true)}
        >
          <Shield size={16} color={Colors.primary} />
          <Text style={styles.doctorPortalBtnText}>
            {language === 'ar' ? '🔐 بوابة تسجيل الأطباء المعتمدين' : '🔐 Doctor & Clinic Portal'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  roleCard: {
    backgroundColor: Colors.secondaryLight,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    marginBottom: 14,
    ...Shadows.sm,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
  },
  roleBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  switchRoleBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  switchRoleBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  langChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  langChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  langChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  switchLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    ...Shadows.sm,
    marginBottom: 14,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
  },
  versionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  versionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  versionValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  versionStatusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  versionStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  checkUpdateBtn: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  checkUpdateBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  infoRow: {
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
  authActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
    marginTop: 6,
  },
  authActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.emergency,
  },
  doctorToolBtn: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  doctorToolBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  doctorPortalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    borderRadius: 14,
    paddingVertical: 13,
    gap: 8,
    marginTop: 6,
    ...Shadows.sm,
  },
  doctorPortalBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  guestCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    ...Shadows.md,
  },
  guestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  guestIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  guestSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  guestActionBtnPrimary: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
    ...Shadows.sm,
  },
  guestActionBtnPrimaryText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  guestActionBtnSecondary: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  guestActionBtnSecondaryText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  guestDoctorBtn: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guestDoctorBtnText: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '700',
  },
  globalSignOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  globalSignOutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
});
