import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Stethoscope,
  User,
  Lock,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  DollarSign,
  PlusCircle,
  X,
  ShieldCheck,
  Check,
} from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { UserRole } from '../types';

interface AuthScreenProps {
  navigation?: any;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const { language, setLanguage, setRole, updateUserProfile, currentUser, t, isRTL } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin Create Doctor Modal States
  const [showAdminDoctorModal, setShowAdminDoctorModal] = useState(false);
  const [adminDocName, setAdminDocName] = useState('');
  const [adminDocEmail, setAdminDocEmail] = useState('');
  const [adminDocPhone, setAdminDocPhone] = useState('');
  const [adminDocSpecialty, setAdminDocSpecialty] = useState('');
  const [adminDocFee, setAdminDocFee] = useState('350');
  const [adminDocAddress, setAdminDocAddress] = useState('');
  const [adminDocPassword, setAdminDocPassword] = useState('');
  const [adminCreating, setAdminCreating] = useState(false);

  // Handle Sign In
  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        language === 'ar' ? 'تنبيه' : 'Notice',
        language === 'ar'
          ? 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور'
          : 'Please enter your email/phone and password'
      );
      return;
    }

    setLoading(true);

    let authEmail = email.trim();
    // If phone number entered, format to internal email
    if (/^[0-9+]+$/.test(authEmail.replace(/\s+/g, ''))) {
      authEmail = `${authEmail.replace(/[^0-9]/g, '')}@asnanji.local`;
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: password.trim(),
      });

      if (error) {
        setLoading(false);
        const isCredError =
          error.message.toLowerCase().includes('invalid login credentials') ||
          error.message.toLowerCase().includes('invalid grant');

        const errMsg = isCredError
          ? language === 'ar'
            ? 'بيانات الدخول غير صحيحة، يرجى التأكد من البريد وكلمة المرور'
            : 'Invalid credentials. Please verify your email and password.'
          : error.message;

        Alert.alert(language === 'ar' ? 'فشل تسجيل الدخول' : 'Sign In Failed', errMsg);
        return;
      }

      if (data.user) {
        // Fetch user profile from Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const isDoctorEmail =
          authEmail.toLowerCase().includes('doctor') ||
          profile?.role === 'doctor';

        const determinedRole: UserRole =
          (profile?.role as UserRole) || (isDoctorEmail ? 'doctor' : 'patient');
        const determinedName =
          profile?.full_name || (determinedRole === 'doctor' ? 'طبيب' : 'مريض');
        const determinedPhone = profile?.phone || '';

        await updateUserProfile({
          id: data.user.id,
          fullName: determinedName,
          phone: determinedPhone,
          role: determinedRole,
          medicalHistory: {
            ...currentUser.medicalHistory,
            hasDiabetes: profile?.has_diabetes || false,
            hasHypertension: profile?.has_hypertension || false,
            hasPenicillinAllergy: profile?.has_penicillin_allergy || false,
          },
        });

        setRole(determinedRole);
        setLoading(false);
        return;
      }
    } else {
      setTimeout(() => {
        setLoading(false);
        if (email.includes('doctor')) {
          setRole('doctor');
        } else {
          setRole('patient');
        }
      }, 500);
      return;
    }

    setLoading(false);
  };

  // Handle Patient Sign Up
  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert(
        language === 'ar' ? 'بيانات ناقصة' : 'Missing Information',
        language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all fields'
      );
      return;
    }

    setLoading(true);

    let authEmail = email.trim();
    if (/^[0-9+]+$/.test(authEmail.replace(/\s+/g, ''))) {
      authEmail = `${authEmail.replace(/[^0-9]/g, '')}@asnanji.local`;
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: password.trim(),
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            role: selectedRole,
          },
        },
      });

      if (error) {
        setLoading(false);
        Alert.alert(language === 'ar' ? 'خطأ في إنشاء الحساب' : 'Registration Error', error.message);
        return;
      }

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName.trim(),
          phone: phone.trim(),
          role: selectedRole,
          updated_at: new Date().toISOString(),
        });

        await updateUserProfile({
          id: data.user.id,
          fullName: fullName.trim(),
          phone: phone.trim(),
          role: selectedRole,
          medicalHistory: currentUser.medicalHistory,
        });

        setRole(selectedRole);
        setLoading(false);
        return;
      }
    } else {
      setTimeout(() => {
        setLoading(false);
        setRole(selectedRole);
      }, 500);
      return;
    }

    setLoading(false);
  };

  // Admin Handle Create Doctor Account
  const handleAdminCreateDoctor = async () => {
    if (!adminDocName.trim() || !adminDocEmail.trim() || !adminDocPassword.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم الطبيب وبريده وكلمة المرور');
      return;
    }

    setAdminCreating(true);

    let docAuthEmail = adminDocEmail.trim();
    if (/^[0-9+]+$/.test(docAuthEmail.replace(/\s+/g, ''))) {
      docAuthEmail = `${docAuthEmail.replace(/[^0-9]/g, '')}@asnanji.local`;
    }

    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: docAuthEmail,
        password: adminDocPassword.trim(),
        options: {
          data: {
            full_name: adminDocName.trim(),
            phone: adminDocPhone.trim(),
            role: 'doctor',
          },
        },
      });

      if (authErr) {
        throw authErr;
      }

      if (authData.user) {
        const docId = authData.user.id;

        // 1. Insert into profiles
        await supabase.from('profiles').upsert({
          id: docId,
          full_name: adminDocName.trim(),
          phone: adminDocPhone.trim(),
          role: 'doctor',
          updated_at: new Date().toISOString(),
        });

        // 2. Insert into doctor_profiles
        await supabase.from('doctor_profiles').upsert({
          id: docId,
          slug: docId,
          title: 'استشاري طب وجراحة الأسنان',
          specialty: adminDocSpecialty.trim() || 'جراحة وتجميل الأسنان',
          bio: 'طبيب معتمد في منصة اسنانجي لتقديم أعلى مستويات الرعاية والتشخيص الدقيق.',
          clinic_address: adminDocAddress.trim() || 'القاهرة، مصر',
          consultation_fee: Number(adminDocFee) || 350,
          is_accepting_patients: true,
          updated_at: new Date().toISOString(),
        });

        // 3. Insert into doctor_settings
        await supabase.from('doctor_settings').upsert({
          doctor_id: docId,
          enable_instant_consultation: true,
          enable_booking: true,
          enable_chat: true,
          working_days: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
          working_hours_start: '10:00',
          working_hours_end: '22:00',
          updated_at: new Date().toISOString(),
        });

        setAdminCreating(false);
        setShowAdminDoctorModal(false);

        Alert.alert(
          'تم إنشاء حساب الطبيب بنجاح! 🎉',
          `تم تسجيل د. ${adminDocName} وتفعيل حسابه. يمكنه الآن تسجيل الدخول مباشرة ببريده وكلمة المرور.`
        );
      }
    } catch (err: any) {
      setAdminCreating(false);
      Alert.alert('خطأ أثناء إنشاء حساب الطبيب', err?.message || 'يرجى المحاولة مرة أخرى');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* App Logo & Header */}
        <View style={styles.headerBox}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>
          <Text style={styles.appTitle}>{t.appTitle}</Text>
          <Text style={styles.appSubtitle}>{t.tagline}</Text>
        </View>

        {/* Mode Selector (Sign In / Sign Up) */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'signin' && styles.modeTabActive]}
            onPress={() => setMode('signin')}
          >
            <Text style={[styles.modeTabText, mode === 'signin' && styles.modeTabTextActive]}>
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
            onPress={() => setMode('signup')}
          >
            <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
              {language === 'ar' ? 'إنشاء حساب جديد' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Container */}
        <View style={styles.formCard}>
          {mode === 'signup' && (
            <>
              {/* Role Selection */}
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[styles.roleBtn, selectedRole === 'patient' && styles.roleBtnActive]}
                  onPress={() => setSelectedRole('patient')}
                >
                  <User size={18} color={selectedRole === 'patient' ? Colors.white : Colors.textPrimary} />
                  <Text style={[styles.roleBtnText, selectedRole === 'patient' && styles.roleBtnTextActive]}>
                    {language === 'ar' ? 'مريض' : 'Patient'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleBtn, selectedRole === 'doctor' && styles.roleBtnActive]}
                  onPress={() => setSelectedRole('doctor')}
                >
                  <Stethoscope size={18} color={selectedRole === 'doctor' ? Colors.white : Colors.textPrimary} />
                  <Text style={[styles.roleBtnText, selectedRole === 'doctor' && styles.roleBtnTextActive]}>
                    {language === 'ar' ? 'طبيب' : 'Doctor'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</Text>
                <View style={styles.inputBox}>
                  <User size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder={language === 'ar' ? 'محمد أحمد' : 'Mohamed Ahmed'}
                    placeholderTextColor={Colors.textMuted}
                    textAlign={isRTL ? 'right' : 'left'}
                  />
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Text>
                <View style={styles.inputBox}>
                  <Phone size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="01012345678"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                    textAlign={isRTL ? 'right' : 'left'}
                  />
                </View>
              </View>
            </>
          )}

          {/* Email or Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {language === 'ar' ? 'البريد الإلكتروني أو رقم الهاتف' : 'Email or Phone'}
            </Text>
            <View style={styles.inputBox}>
              <Mail size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={
                  mode === 'signin'
                    ? language === 'ar'
                      ? 'البريد أو الهاتف (مثال: 010...)'
                      : 'Email or Phone'
                    : 'user@example.com'
                }
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                textAlign={isRTL ? 'right' : 'left'}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{language === 'ar' ? 'كلمة المرور' : 'Password'}</Text>
            <View style={styles.inputBox}>
              <Lock size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                textAlign={isRTL ? 'right' : 'left'}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={mode === 'signin' ? handleSignIn : handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'signin'
                  ? language === 'ar'
                    ? 'تسجيل الدخول 🚀'
                    : 'Sign In 🚀'
                  : language === 'ar'
                  ? 'إنشاء الحساب الآن ✨'
                  : 'Sign Up ✨'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Admin Create Doctor Button */}
          <View style={styles.adminSection}>
            <TouchableOpacity
              style={styles.adminDoctorBtn}
              onPress={() => setShowAdminDoctorModal(true)}
            >
              <PlusCircle size={16} color={Colors.primaryDark} />
              <Text style={styles.adminDoctorBtnText}>
                {language === 'ar'
                  ? '➕ إضافة حساب طبيب جديد (لوحة الإدارة)'
                  : '➕ Add New Doctor Account (Admin)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Admin Create Doctor Modal */}
      <Modal visible={showAdminDoctorModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <Stethoscope size={24} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>إضافة طبيب جديد للمنصة 👨‍⚕️</Text>
                <Text style={styles.modalSubtitle}>
                  إنشاء حساب طبيب جديد وتفعيله فوراً في Supabase
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAdminDoctorModal(false)}>
                <X size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>اسم الطبيب الكامل</Text>
                  <View style={styles.inputBox}>
                    <User size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={adminDocName}
                      onChangeText={setAdminDocName}
                      placeholder="د. أحمد الشناوي"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>البريد الإلكتروني للطبيب</Text>
                  <View style={styles.inputBox}>
                    <Mail size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={adminDocEmail}
                      onChangeText={setAdminDocEmail}
                      placeholder="doctor.ahmed@asnanji.com"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>كلمة المرور المبدئية</Text>
                  <View style={styles.inputBox}>
                    <Lock size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={adminDocPassword}
                      onChangeText={setAdminDocPassword}
                      placeholder="كلمة مرور من 6 أحرف على الأقل"
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>التخصص الطبي</Text>
                  <View style={styles.inputBox}>
                    <Briefcase size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={adminDocSpecialty}
                      onChangeText={setAdminDocSpecialty}
                      placeholder="أخصائي تقويم وتجميل الأسنان"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>سعر الكشف (ج.م)</Text>
                  <View style={styles.inputBox}>
                    <DollarSign size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={adminDocFee}
                      onChangeText={setAdminDocFee}
                      placeholder="350"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>عنوان العيادة</Text>
                  <View style={styles.inputBox}>
                    <MapPin size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={adminDocAddress}
                      onChangeText={setAdminDocAddress}
                      placeholder="الدقي، الجيزة"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, adminCreating && styles.submitBtnDisabled]}
              onPress={handleAdminCreateDoctor}
              disabled={adminCreating}
            >
              {adminCreating ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.modalSubmitText}>تأكيد وإنشاء حساب الطبيب 🚀</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...Shadows.md,
  },
  logoImage: {
    width: 75,
    height: 75,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  appSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.border,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  modeTabTextActive: {
    color: Colors.primaryDark,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    ...Shadows.sm,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    gap: 6,
  },
  roleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  roleBtnTextActive: {
    color: Colors.white,
  },
  inputGroup: {
    marginBottom: 14,
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
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
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    ...Shadows.md,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  adminSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  adminDoctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  adminDoctorBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 10,
  },
  modalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalForm: {
    gap: 4,
    paddingVertical: 6,
  },
  modalSubmitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14,
    ...Shadows.md,
  },
  modalSubmitText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
