import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Lock, Mail, Phone, User, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { UserProfile } from '../types';

interface QuickAuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
  actionTitle?: string; // e.g. "إرسال الاستشارة" or "تأكيد حجز الموعد"
  doctorName?: string;
  initialName?: string;
  initialPhone?: string;
}

export const QuickAuthModal: React.FC<QuickAuthModalProps> = ({
  visible,
  onClose,
  onSuccess,
  actionTitle = 'المتابعة',
  doctorName,
  initialName = '',
  initialPhone = '',
}) => {
  const { language, currentUser, updateUserProfile, setRole } = useApp();
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');

  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialName && !fullName) setFullName(initialName);
    if (initialPhone && !phone) setPhone(initialPhone);
  }, [initialName, initialPhone]);

  const handleSignUp = async () => {
    if (!fullName.trim()) {
      Alert.alert(language === 'ar' ? 'تنبيه' : 'Notice', language === 'ar' ? 'يرجى إدخال اسمك بالكامل' : 'Please enter your full name');
      return;
    }
    if (!phone.trim()) {
      Alert.alert(language === 'ar' ? 'تنبيه' : 'Notice', language === 'ar' ? 'يرجى إدخال رقم هاتفك للتواصل' : 'Please enter your phone number');
      return;
    }
    if (!password.trim() || password.length < 6) {
      Alert.alert(language === 'ar' ? 'تنبيه' : 'Notice', language === 'ar' ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف/أرقام' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    let authEmail = email.trim();
    if (!authEmail) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      authEmail = `${cleanPhone || 'patient_' + Date.now()}@asnanji.local`;
    }

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: password.trim(),
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
              role: 'patient',
            },
          },
        });

        if (error) {
          // If already registered, suggest signin
          if (error.message.includes('already registered')) {
            Alert.alert(
              language === 'ar' ? 'الحساب موجود بالفعل' : 'Account Exists',
              language === 'ar' ? 'هذا الحساب مسجل من قبل، يرجى تسجيل الدخول' : 'This account is already registered. Please sign in.'
            );
            setMode('signin');
            setLoading(false);
            return;
          }
          throw error;
        }

        const newUserId = data.user?.id || `usr_${Date.now()}`;
        await supabase.from('profiles').upsert({
          id: newUserId,
          full_name: fullName.trim(),
          phone: phone.trim(),
          role: 'patient',
          updated_at: new Date().toISOString(),
        });

        const newProfile: UserProfile = {
          ...currentUser,
          id: newUserId,
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: authEmail,
          role: 'patient',
        };

        await updateUserProfile(newProfile);
        setRole('patient');
        setLoading(false);
        onSuccess(newProfile);
      } else {
        const mockProfile: UserProfile = {
          ...currentUser,
          id: `pat_${Date.now()}`,
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: authEmail,
          role: 'patient',
        };
        await updateUserProfile(mockProfile);
        setRole('patient');
        setLoading(false);
        onSuccess(mockProfile);
      }
    } catch (err: any) {
      setLoading(false);
      Alert.alert(language === 'ar' ? 'خطأ في إنشاء الحساب' : 'Registration Error', err.message || 'حدث خطأ أثناء التسجيل');
    }
  };

  const handleSignIn = async () => {
    let authEmail = email.trim();
    if (!authEmail && phone.trim()) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      authEmail = `${cleanPhone}@asnanji.local`;
    }

    if (!authEmail || !password.trim()) {
      Alert.alert(language === 'ar' ? 'تنبيه' : 'Notice', language === 'ar' ? 'يرجى إدخال البريد/الهاتف وكلمة المرور' : 'Please enter credentials');
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: password.trim(),
        });

        if (error) throw error;

        const userId = data.user.id;
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        const updatedProfile: UserProfile = {
          ...currentUser,
          id: userId,
          fullName: profileData?.full_name || currentUser.fullName || 'مريض اسنانجي',
          phone: profileData?.phone || currentUser.phone || '',
          email: data.user.email || '',
          role: (profileData?.role as any) || 'patient',
        };

        await updateUserProfile(updatedProfile);
        setRole(updatedProfile.role);
        setLoading(false);
        onSuccess(updatedProfile);
      } else {
        const mockProfile: UserProfile = {
          ...currentUser,
          id: `pat_local_${Date.now()}`,
          role: 'patient',
        };
        await updateUserProfile(mockProfile);
        setLoading(false);
        onSuccess(mockProfile);
      }
    } catch (err: any) {
      setLoading(false);
      Alert.alert(language === 'ar' ? 'خطأ في تسجيل الدخول' : 'Sign In Error', err.message || 'بيانات الدخول غير صحيحة');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <ShieldCheck size={16} color={Colors.primary} />
                <Text style={styles.badgeText}>
                  {language === 'ar' ? 'حساب مريض موثق وآمن' : 'Verified Patient Account'}
                </Text>
              </View>
              <Text style={styles.sheetTitle}>
                {language === 'ar' ? `خطوة أخيرة لـ ${actionTitle}` : `Final Step: ${actionTitle}`}
              </Text>
              {doctorName && (
                <Text style={styles.sheetSubtitle}>
                  {language === 'ar'
                    ? `لربط بياناتك الطبية والمتابعة المباشرة مع د. ${doctorName}`
                    : `To route your case and follow up with Dr. ${doctorName}`}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
                {language === 'ar' ? 'إنشاء حساب مريض جديد' : 'New Patient Account'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'signin' && styles.modeTabActive]}
              onPress={() => setMode('signin')}
            >
              <Text style={[styles.modeTabText, mode === 'signin' && styles.modeTabTextActive]}>
                {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
            {mode === 'signup' ? (
              <View style={styles.formContainer}>
                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {language === 'ar' ? 'الاسم بالكامل' : 'Full Name'} *
                  </Text>
                  <View style={styles.inputWrapper}>
                    <User size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={language === 'ar' ? 'أدخل اسمك ثلاثي' : 'Enter your full name'}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>

                {/* Phone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {language === 'ar' ? 'رقم الهاتف / الواتساب' : 'Phone / WhatsApp'} *
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Phone size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="+20 100 123 4567"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>

                {/* Optional Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {language === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="name@example.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {language === 'ar' ? 'كلمة المرور' : 'Password'} *
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={language === 'ar' ? '6 أحرف أو أرقام على الأقل' : 'At least 6 characters'}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.formContainer}>
                {/* Email or Phone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {language === 'ar' ? 'البريد الإلكتروني أو الهاتف' : 'Email or Phone'} *
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={language === 'ar' ? 'أدخل بريدك أو رقم هاتفك' : 'Enter email or phone'}
                      value={email || phone}
                      onChangeText={(val) => {
                        if (val.includes('@')) setEmail(val);
                        else setPhone(val);
                      }}
                      autoCapitalize="none"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {language === 'ar' ? 'كلمة المرور' : 'Password'} *
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="••••••••"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={mode === 'signup' ? handleSignUp : handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <CheckCircle2 size={18} color={Colors.white} />
                <Text style={styles.submitBtnText}>
                  {mode === 'signup'
                    ? language === 'ar'
                      ? `إنشاء الحساب و${actionTitle} 🚀`
                      : `Register & Complete ${actionTitle}`
                    : language === 'ar'
                    ? `تسجيل الدخول و${actionTitle} 🚀`
                    : `Sign In & Complete ${actionTitle}`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    ...Shadows.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: Colors.white,
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
  formContainer: {
    gap: 12,
    paddingBottom: 8,
  },
  inputGroup: {},
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  submitBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    gap: 8,
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
});
