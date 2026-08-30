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
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Stethoscope,
  User,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Globe,
  ArrowRight,
  Sparkles,
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

  // Handle Sign In
  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        language === 'ar' ? 'تنبيه' : 'Notice',
        language === 'ar'
          ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
          : 'Please enter your email and password'
      );
      return;
    }

    setLoading(true);

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setLoading(false);
        const isCredError = error.message.toLowerCase().includes('invalid login credentials') || error.message.toLowerCase().includes('invalid grant');
        const errMsg = isCredError
          ? (language === 'ar'
              ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة، أو لم يتم إنشاء هذا الحساب بعد.\n\nهل تود إنشاء الحساب الآن؟'
              : 'Invalid credentials or account not registered yet. Would you like to create an account now?')
          : error.message;

        if (isCredError) {
          Alert.alert(
            language === 'ar' ? 'تعذر تسجيل الدخول' : 'Sign In Failed',
            errMsg,
            [
              { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
              {
                text: language === 'ar' ? 'إنشاء حساب جديد' : 'Sign Up Now',
                onPress: () => setMode('signup'),
              },
            ]
          );
        } else {
          Alert.alert(language === 'ar' ? 'خطأ' : 'Error', errMsg);
        }
        return;
      }

      if (data.user) {
        const isDoc = email.trim().toLowerCase() === 'karim@smartdental.com' || email.trim().toLowerCase().includes('doctor');
        // Fetch user profile from Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        let determinedRole: UserRole = (profile?.role as UserRole) || (isDoc ? 'doctor' : 'patient');
        let determinedName = profile?.full_name || (isDoc ? 'د. كريم أبو بكر' : 'مستخدم');
        let determinedPhone = profile?.phone || (isDoc ? '+20 100 000 0000' : '');

        setRole(determinedRole);
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

        setLoading(false);
        if (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
          navigation.goBack();
        }
        return;
      }
    } else {
      // Local development simulation
      setTimeout(() => {
        setLoading(false);
        if (email.includes('doctor') || email.includes('karim')) {
          setRole('doctor');
        } else {
          setRole('patient');
        }
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 500);
      return;
    }

    setLoading(false);
  };

  // Handle Sign Up
  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert(
        language === 'ar' ? 'تنبيه' : 'Notice',
        language === 'ar'
          ? 'يرجى إدخال الاسم، البريد الإلكتروني وكلمة المرور'
          : 'Please fill in name, email and password'
      );
      return;
    }

    setLoading(true);

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            role: email.trim() === 'karim@smartdental.com' ? 'doctor' : 'patient',
          },
        },
      });

      if (error) {
        setLoading(false);
        Alert.alert(language === 'ar' ? 'خطأ' : 'Error', error.message);
        return;
      }

      if (data.user) {
        const isDoc = email.trim() === 'karim@smartdental.com';
        // Insert into public.profiles
        await (supabase.from('profiles') as any).upsert({
          id: data.user.id,
          full_name: fullName.trim() || (isDoc ? 'د. كريم أبو بكر' : 'مستخدم جديد'),
          phone: phone.trim(),
          role: isDoc ? 'doctor' : 'patient',
          has_diabetes: false,
          has_hypertension: false,
          has_penicillin_allergy: false,
        });

        setRole(isDoc ? 'doctor' : 'patient');
        updateUserProfile({
          id: data.user.id,
          fullName: fullName.trim() || (isDoc ? 'د. كريم أبو بكر' : 'مستخدم جديد'),
          phone: phone.trim(),
        });

        setLoading(false);
        Alert.alert(
          language === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account Created',
          language === 'ar' ? 'مرحباً بك في المنظومة الذكية للعيادة!' : 'Welcome to the Smart Dental Clinic!'
        );
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
        return;
      }
    } else {
      // Offline fallback
      setTimeout(() => {
        setLoading(false);
        const isDoc = email.trim() === 'karim@smartdental.com';
        setRole(isDoc ? 'doctor' : selectedRole);
        updateUserProfile({
          id: `user_${Date.now()}`,
          fullName: fullName.trim(),
          phone: phone.trim(),
        });
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 500);
      return;
    }

    setLoading(false);
  };

  // Instant Guest Mode Entry
  const handleGuestMode = (guestRole: UserRole) => {
    setRole(guestRole);
    updateUserProfile({
      id: `guest_${guestRole}_${Date.now()}`,
      fullName: guestRole === 'doctor' ? 'د. كريم أبو بكر' : 'مريض زائر (Guest Patient)',
      phone: '+20 100 000 0000',
    });
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Language Toggle */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          >
            <Globe size={14} color={Colors.primaryDark} />
            <Text style={styles.langBtnText}>
              {language === 'ar' ? 'English' : 'عربي'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Clinic Branding Header */}
        <View style={styles.brandingHeader}>
          <Image
            source={require('../../assets/app_logo.png')}
            style={styles.logoAvatar}
            resizeMode="contain"
          />
          <Text style={styles.appTitle}>{t.appTitle}</Text>
          <Text style={styles.tagline}>{t.tagline}</Text>
        </View>

        {/* Mode Switcher Tabs */}
        <View style={styles.authCard}>
          <View style={styles.tabSwitchContainer}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                mode === 'signin' && styles.tabBtnActive,
              ]}
              onPress={() => setMode('signin')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  mode === 'signin' && styles.tabBtnTextActive,
                ]}
              >
                {t.signIn}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                mode === 'signup' && styles.tabBtnActive,
              ]}
              onPress={() => setMode('signup')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  mode === 'signup' && styles.tabBtnTextActive,
                ]}
              >
                {t.signUp}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          {mode === 'signup' && (
            <>
              {/* Full Name */}
              <Text style={styles.fieldLabel}>{t.fullNamePlaceholder}:</Text>
              <View style={styles.inputBox}>
                <User size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder={
                    selectedRole === 'doctor' ? 'د. كريم أبو بكر' : 'أحمد محمود'
                  }
                  value={fullName}
                  onChangeText={setFullName}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

              {/* Phone */}
              <Text style={styles.fieldLabel}>{t.phonePlaceholder}:</Text>
              <View style={styles.inputBox}>
                <Phone size={18} color={Colors.textMuted} />
                <TextInput
                  style={[styles.input, { writingDirection: 'ltr' }]}
                  placeholder="+20 111 234 5678"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>
            </>
          )}

          {/* Email */}
          <Text style={styles.fieldLabel}>{t.emailPlaceholder}:</Text>
          <View style={styles.inputBox}>
            <Mail size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="example@dental.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>

          {/* Password */}
          <Text style={styles.fieldLabel}>{t.passwordPlaceholder}:</Text>
          <View style={styles.inputBox}>
            <Lock size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>

          {/* Submit Auth Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={mode === 'signin' ? handleSignIn : handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'signin' ? t.signIn : t.signUp}
              </Text>
            )}
          </TouchableOpacity>

          {/* Switch Mode Prompt */}
          <TouchableOpacity
            style={styles.switchModePrompt}
            onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            <Text style={styles.switchModeText}>
              {mode === 'signin' ? t.dontHaveAccount : t.alreadyHaveAccount}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Guest Mode Card */}
        <View style={styles.guestCard}>
          <TouchableOpacity
            style={styles.guestBtnPatient}
            onPress={() => handleGuestMode('patient')}
          >
            <User size={16} color={Colors.white} />
            <Text style={styles.guestBtnText}>
              {language === 'ar' ? '⚡ الدخول كزائر (بدون تسجيل حساب)' : '⚡ Continue as Guest Patient'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  brandingHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoAvatar: {
    width: 96,
    height: 96,
    borderRadius: 22,
    marginBottom: 12,
    ...Shadows.md,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  authCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
    marginBottom: 16,
  },
  tabSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabBtnTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
    marginTop: 4,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#f8fafc',
  },
  roleChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  roleChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    ...Shadows.sm,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
  },
  switchModePrompt: {
    marginTop: 14,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  guestCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  guestTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  guestBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  guestBtnPatient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
  },
  guestBtnDoctor: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    paddingVertical: 10,
  },
  guestBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
  },
});
