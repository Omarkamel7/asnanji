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
  Linking,
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
  FileText,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { UserRole } from '../types';

interface AuthScreenProps {
  navigation?: any;
  route?: any;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ navigation, route }) => {
  const { language, setLanguage, setRole, updateUserProfile, currentUser, t, isRTL, submitDoctorApplication } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup'>(
    route?.params?.initialMode === 'signup' ? 'signup' : 'signin'
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');

  // React to route params changes
  React.useEffect(() => {
    if (route?.params?.initialMode) {
      setMode(route?.params?.initialMode);
    }
    if (route?.params?.openDoctorModal) {
      setShowDoctorAppModal(true);
    }
  }, [route?.params?.initialMode, route?.params?.openDoctorModal]);

  // Automatically navigate after successful login (including Google OAuth deep link return)
  React.useEffect(() => {
    if (currentUser && currentUser.id) {
      console.log('[AuthScreen] User authenticated, auto-navigating:', currentUser.role);
      navigateAfterAuth(currentUser.role || 'patient');
    }
  }, [currentUser]);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Doctor Application Modal States (Professional Onboarding)
  const [showDoctorAppModal, setShowDoctorAppModal] = useState(
    !!route?.params?.openDoctorModal
  );
  const [appFullName, setAppFullName] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appEmail, setAppEmail] = useState('');
  const [appSpecialty, setAppSpecialty] = useState('');
  const [appDegree, setAppDegree] = useState<'specialist' | 'consultant' | 'professor'>('specialist');
  const [appSyndicateId, setAppSyndicateId] = useState('');
  const [appClinicAddress, setAppClinicAddress] = useState('');
  const [appGovernorate, setAppGovernorate] = useState('القاهرة');
  const [appFee, setAppFee] = useState('350');
  const [appPassword, setAppPassword] = useState('');
  const [appSubmitting, setAppSubmitting] = useState(false);

  // Phone Linking Modal (Zero-cost phone capture after Google login)
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [pendingUserId, setPendingUserId] = useState('');
  const [promptPhone, setPromptPhone] = useState('');

  const navigateAfterAuth = (userRole: UserRole) => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      const target =
        userRole === 'admin'
          ? 'AdminRoot'
          : userRole === 'doctor'
          ? 'DoctorRoot'
          : userRole === 'assistant'
          ? 'AssistantRoot'
          : userRole === 'pending_doctor'
          ? 'DoctorPendingRoot'
          : 'PatientRoot';
      navigation?.reset?.({
        index: 0,
        routes: [{ name: target }],
      });
    }
  };

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
          profile?.full_name || (determinedRole === 'doctor' ? 'طبيب' : determinedRole === 'assistant' ? 'مساعد العيادة' : 'مريض');
        const determinedPhone = profile?.phone || '';

        await updateUserProfile({
          id: data.user.id,
          fullName: determinedName,
          phone: determinedPhone,
          role: determinedRole,
          assignedDoctorId: profile?.assigned_doctor_id,
          medicalHistory: {
            ...currentUser.medicalHistory,
            hasDiabetes: profile?.has_diabetes || false,
            hasHypertension: profile?.has_hypertension || false,
            hasPenicillinAllergy: profile?.has_penicillin_allergy || false,
          },
        });

        setRole(determinedRole);
        setLoading(false);
        navigateAfterAuth(determinedRole);
        return;
      }
    } else {
      setTimeout(() => {
        setLoading(false);
        const resolvedRole = email.includes('doctor') ? 'doctor' : 'patient';
        setRole(resolvedRole);
        navigateAfterAuth(resolvedRole);
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
        navigateAfterAuth(selectedRole);
        return;
      }
    } else {
      setTimeout(() => {
        setLoading(false);
        setRole(selectedRole);
        navigateAfterAuth(selectedRole);
      }, 500);
      return;
    }

    setLoading(false);
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'asnanji://auth/callback',
          },
        });

        if (error) {
          throw error;
        }

        if (data?.url) {
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.location.href = data.url;
          } else {
            await Linking.openURL(data.url);
          }
        }
      } else {
        // Local simulation fallback
        setTimeout(() => {
          setRole('patient');
          navigateAfterAuth('patient');
        }, 600);
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      Alert.alert(
        language === 'ar' ? 'تعذر تسجيل الدخول بجوجل' : 'Google Sign-In Failed',
        err?.message || (language === 'ar' ? 'يرجى المحاولة بالبريد الإلكتروني وكلمة المرور' : 'Please try with email and password')
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  // Save phone number captured after Google Sign-In
  const handleSavePromptPhone = async () => {
    if (!promptPhone.trim()) {
      setShowPhonePrompt(false);
      setRole('patient');
      return;
    }

    try {
      if (isSupabaseConfigured && pendingUserId) {
        await supabase
          .from('profiles')
          .update({ phone: promptPhone.trim() })
          .eq('id', pendingUserId);
      }
      await updateUserProfile({ phone: promptPhone.trim() });
    } catch (e) {
      console.warn('Save prompt phone error:', e);
    } finally {
      setShowPhonePrompt(false);
      setRole('patient');
    }
  };

  // Doctor Application Submission Handler
  const handleSubmitDoctorApplication = async () => {
    if (
      !appFullName.trim() ||
      !appPhone.trim() ||
      !appEmail.trim() ||
      !appSpecialty.trim() ||
      !appClinicAddress.trim() ||
      appPassword.trim().length < 6
    ) {
      Alert.alert(
        language === 'ar' ? 'بيانات مطلوبة' : 'Missing Fields',
        language === 'ar'
          ? 'يرجى استيفاء كافة بيانات استمارة الاعتماد وتعيين كلمة مرور لا تقل عن 6 أحرف'
          : 'Please fill all doctor application fields and set a password of at least 6 characters'
      );
      return;
    }

    setAppSubmitting(true);
    try {
      let createdUserId = '';
      if (isSupabaseConfigured) {
        try {
          const { data: authData } = await supabase.auth.signUp({
            email: appEmail.trim(),
            password: appPassword.trim(),
            options: {
              data: {
                full_name: appFullName.trim(),
                phone: appPhone.trim(),
                role: 'pending_doctor',
              },
            },
          });
          if (authData?.user) {
            createdUserId = authData.user.id;
            await supabase.from('profiles').upsert({
              id: createdUserId,
              full_name: appFullName.trim(),
              phone: appPhone.trim(),
              role: 'pending_doctor',
              updated_at: new Date().toISOString(),
            });
          }
        } catch (authErr) {
          console.warn('Doctor auth creation note:', authErr);
        }
      }

      await submitDoctorApplication({
        userId: createdUserId || undefined,
        fullName: appFullName.trim(),
        phone: appPhone.trim(),
        email: appEmail.trim(),
        specialty: appSpecialty.trim(),
        degree: appDegree,
        syndicateId: appSyndicateId.trim(),
        clinicAddress: appClinicAddress.trim(),
        governorate: appGovernorate,
        consultationFee: Number(appFee) || 350,
      });

      setAppSubmitting(false);
      setShowDoctorAppModal(false);

      Alert.alert(
        language === 'ar' ? 'تم استلام طلب انضمامك بنجاح! 🩺✨' : 'Application Received! 🩺✨',
        language === 'ar'
          ? `أهلاً بك د. ${appFullName} في شبكة أطباء اسنانجي!\nتم تسجيل حسابك بنجاح وطلبك قيد المراجعة والاعتماد الطبي الآن. يمكنك تسجيل الدخول بنفس البريد وكلمة المرور فور اعتماد الحساب.`
          : `Welcome Dr. ${appFullName}! Your account has been registered and is pending admin verification.`
      );

      // Reset form
      setAppFullName('');
      setAppPhone('');
      setAppEmail('');
      setAppPassword('');
      setAppSpecialty('');
      setAppSyndicateId('');
      setAppClinicAddress('');
    } catch (err: any) {
      setAppSubmitting(false);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        err?.message || (language === 'ar' ? 'تعذر إرسال الطلب، يرجى المحاولة لاحقاً' : 'Could not submit application')
      );
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
              {/* Role Indicator Banner */}
              <View style={{ marginBottom: 14, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#BFDBFE' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.primaryDark }}>
                  {language === 'ar' ? '👤 حساب مريض جديد' : '👤 New Patient Account'}
                </Text>
                <TouchableOpacity onPress={() => setShowDoctorAppModal(true)} style={{ marginTop: 4 }}>
                  <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '700' }}>
                    {language === 'ar' ? 'هل أنت طبيب أسنان؟ انقر هنا للتقديم والاعتماد 🩺' : 'Are you a dentist? Tap here to apply for clinic verification 🩺'}
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

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{language === 'ar' ? 'أو عبر' : 'Or with'}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google One-Tap Sign In */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={Colors.textPrimary} size="small" />
            ) : (
              <>
                <View style={styles.googleIconBadge}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#4285F4' }}>G</Text>
                </View>
                <Text style={styles.googleBtnText}>
                  {language === 'ar'
                    ? 'الدخول السريع بحساب Google'
                    : 'Continue with Google'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Doctor Onboarding Application Promo Box */}
          <View style={styles.doctorInviteBox}>
            <View style={styles.doctorInviteHeader}>
              <View style={styles.doctorInviteIcon}>
                <Stethoscope size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.doctorInviteTitle}>
                  {language === 'ar' ? 'هل أنت طبيب أسنان؟ 🩺' : 'Are you a Dentist? 🩺'}
                </Text>
                <Text style={styles.doctorInviteSubtitle}>
                  {language === 'ar'
                    ? 'انضم لشبكة أطباء اسنانجي وابدأ استقبال المرضى فوراً'
                    : 'Join Asnanji Network & start receiving clinic patients'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.doctorApplyBtn}
              onPress={() => setShowDoctorAppModal(true)}
            >
              <Text style={styles.doctorApplyBtnText}>
                {language === 'ar' ? 'تقديم طلب انضمام العيادة 📝' : 'Apply for Clinic Verification 📝'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Doctor Application Modal */}
      <Modal visible={showDoctorAppModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <Stethoscope size={24} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {language === 'ar' ? 'طلب انضمام طبيب أسنان 🩺' : 'Dentist Onboarding Application'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {language === 'ar' ? 'يتم مراجعة الطلب واعتماده من الإدارة خلال دقائق' : 'Admin verifies and activates within minutes'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowDoctorAppModal(false)}>
                <X size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>الاسم الثلاثي للطبيب</Text>
                  <View style={styles.inputBox}>
                    <User size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={appFullName}
                      onChangeText={setAppFullName}
                      placeholder="د. أحمد الشناوي"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>رقم هاتف العيادة / الواتساب</Text>
                  <View style={styles.inputBox}>
                    <Phone size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={appPhone}
                      onChangeText={setAppPhone}
                      placeholder="01012345678"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>البريد الإلكتروني المهني</Text>
                  <View style={styles.inputBox}>
                    <Mail size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={appEmail}
                      onChangeText={setAppEmail}
                      placeholder="dr.ahmed@clinic.com"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>كلمة المرور لتسجيل الدخول للحساب</Text>
                  <View style={styles.inputBox}>
                    <Lock size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={appPassword}
                      onChangeText={setAppPassword}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry
                    />
                  </View>
                  <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>
                    ستستخدم هذه الكلمة والبريد الإلكتروني للدخول فور اعتماد الحساب.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>التخصص الطبي الدقيق</Text>
                  <View style={styles.inputBox}>
                    <Briefcase size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={appSpecialty}
                      onChangeText={setAppSpecialty}
                      placeholder="أخصائي تقويم وتجميل الأسنان"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>رقم القيد بنقابة أطباء الأسنان</Text>
                  <View style={styles.inputBox}>
                    <ShieldCheck size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={appSyndicateId}
                      onChangeText={setAppSyndicateId}
                      placeholder="12845 / 2018"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>عنوان العيادة والمحافظة</Text>
                  <View style={styles.inputBox}>
                    <MapPin size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={appClinicAddress}
                      onChangeText={setAppClinicAddress}
                      placeholder="شارع التحرير، الدقي، الجيزة"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>سعر الكشف المبدئي (ج.م)</Text>
                  <View style={styles.inputBox}>
                    <DollarSign size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={appFee}
                      onChangeText={setAppFee}
                      placeholder="350"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, appSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmitDoctorApplication}
              disabled={appSubmitting}
            >
              {appSubmitting ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.modalSubmitText}>إرسال طلب الاعتماد الرسمي 🚀</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Zero-Cost Phone Capture Modal after Google Login */}
      <Modal visible={showPhonePrompt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { padding: 24 }]}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={[styles.modalIconBox, { backgroundColor: Colors.primaryLight }]}>
                <Phone size={24} color={Colors.primary} />
              </View>
              <Text style={[styles.modalTitle, { fontSize: 17, marginTop: 10, textAlign: 'center' }]}>
                {language === 'ar' ? 'مرحباً بك في اسنانجي! 🦷' : 'Welcome to Asnanji! 🦷'}
              </Text>
              <Text style={{ fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
                {language === 'ar'
                  ? 'يرجى تزويدنا برقم هاتفك لسهولة تواصل العيادة وتأكيد مواعيدك عبر الواتساب مجاناً'
                  : 'Enter your phone number for appointment updates via WhatsApp'}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputBox}>
                <Phone size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={promptPhone}
                  onChangeText={setPromptPhone}
                  placeholder="01012345678"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { marginTop: 16 }]}
              onPress={handleSavePromptPhone}
            >
              <Text style={styles.modalSubmitText}>
                {language === 'ar' ? 'حفظ ومتابعة إلى العيادة ✨' : 'Save & Continue ✨'}
              </Text>
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    ...Shadows.sm,
  },
  googleIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F4F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  doctorInviteBox: {
    marginTop: 22,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: '#C7E4F9',
  },
  doctorInviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  doctorInviteIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInviteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  doctorInviteSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  doctorApplyBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  doctorApplyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
  },
});
