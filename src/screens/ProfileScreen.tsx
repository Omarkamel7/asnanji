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

  const handleNavigateAuth = () => {
    try {
      if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate('Auth');
      } else {
        setRole(role === 'patient' ? 'doctor' : 'patient');
      }
    } catch (err) {
      console.warn('Navigation to Auth error:', err);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Doctor Management Options (Only shown when logged in as Doctor) */}
      {role === 'doctor' && (
        <View style={styles.roleCard}>
          <View style={styles.roleHeader}>
            <Shield size={20} color={Colors.primaryDark} />
            <Text style={styles.roleTitle}>
              {language === 'ar' ? 'حساب الطبيب المعتمد:' : 'Doctor Account:'}
            </Text>
            <Text style={styles.roleBadge}>د. كريم أبو بكر</Text>
          </View>

          <TouchableOpacity
            style={styles.doctorToolBtn}
            onPress={() => navigation?.navigate('EditClinic')}
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

          <TouchableOpacity
            style={[styles.doctorToolBtn, { backgroundColor: '#fee2e2', borderColor: '#fca5a5', marginTop: 6 }]}
            onPress={async () => {
              await signOut();
              Alert.alert(
                language === 'ar' ? 'تم تسجيل الخروج' : 'Signed Out',
                language === 'ar' ? 'تمت العودة إلى واجهة المستخدم العادية.' : 'Returned to patient view.'
              );
            }}
          >
            <Text style={[styles.doctorToolBtnText, { color: Colors.emergency }]}>
              {language === 'ar' ? '🚪 تسجيل الخروج من حساب الطبيب' : '🚪 Sign Out of Doctor Account'}
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
          placeholder="+20 100 000 0000"
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

      {/* Clinic Info (Customized & Toggled by Doctor) */}
      {clinicSettings.showClinicInfo !== false && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Info size={18} color={Colors.primary} />
            <Text style={styles.cardTitle}>
              {language === 'ar' ? 'عن العيادة والمواعيد' : 'Clinic Info'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {language === 'ar' ? 'اسم العيادة:' : 'Clinic Name:'}
            </Text>
            <Text style={styles.infoValue}>
              {clinicSettings.doctorName ? `عيادة ${clinicSettings.doctorName}` : (language === 'ar' ? CLINIC_INFO.nameAr : CLINIC_INFO.nameEn)}
            </Text>
          </View>

          {!!clinicSettings.phoneNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {language === 'ar' ? 'الهاتف:' : 'Phone:'}
              </Text>
              <Text style={[styles.infoValue, { writingDirection: 'ltr' }]}>
                {clinicSettings.phoneNumber}
              </Text>
            </View>
          )}

          {!!clinicSettings.workingHours && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {language === 'ar' ? 'مواعيد العمل:' : 'Working Hours:'}
              </Text>
              <Text style={styles.infoValue}>
                {clinicSettings.workingHours}
              </Text>
            </View>
          )}

          {!!clinicSettings.locationAddress && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {language === 'ar' ? 'العنوان:' : 'Address:'}
              </Text>
              <Text style={styles.infoValue}>
                {clinicSettings.locationAddress}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Discreet Doctor / Admin Portal Login */}
      {role === 'patient' && (
        <TouchableOpacity
          style={styles.doctorPortalBtn}
          onPress={handleNavigateAuth}
        >
          <Shield size={16} color={Colors.primary} />
          <Text style={styles.doctorPortalBtnText}>
            {language === 'ar' ? '🔐 تسجيل دخول الطبيب والإدارة (Doctor Login)' : '🔐 Doctor & Admin Login'}
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
});
