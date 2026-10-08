import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import {
  Users,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Phone,
  Lock,
  User,
  Trash2,
  Share2,
  Calendar,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { supabase, isSupabaseConfigured } from '../../services/supabase';

interface AssistantItem {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  createdAt: string;
}

export const ManageAssistantsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { language, isRTL, currentUser } = useApp();
  const [assistants, setAssistants] = useState<AssistantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('SmartClinic@2026');
  const [creating, setCreating] = useState(false);

  const fetchAssistants = useCallback(async () => {
    if (!isSupabaseConfigured || !currentUser?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('assigned_doctor_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setAssistants(
          data.map((item: any) => ({
            id: item.id,
            fullName: item.full_name || 'مساعد العيادة',
            phone: item.phone || '',
            role: item.role || 'assistant',
            createdAt: item.created_at || new Date().toISOString(),
          }))
        );
      }
    } catch (e) {
      console.warn('Error fetching assistants:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchAssistants();
  }, [fetchAssistants]);

  const handleCreateAssistant = async () => {
    if (!name.trim() || !phone.trim() || !password.trim()) {
      Alert.alert(
        language === 'ar' ? 'بيانات ناقصة' : 'Missing Information',
        language === 'ar' ? 'يرجى إدخال اسم المساعد، ورقم الهاتف، وكلمة المرور' : 'Please provide name, phone and password'
      );
      return;
    }

    setCreating(true);
    try {
      const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
      const authEmail = `${cleanPhone}@asnanji.local`;

      // 1. Sign up assistant account in auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: authEmail,
        password: password.trim(),
        options: {
          data: {
            full_name: name.trim(),
            phone: phone.trim(),
            role: 'assistant',
            assigned_doctor_id: currentUser.id,
          },
        },
      });

      if (authErr && !authErr.message.includes('already registered')) {
        throw authErr;
      }

      const assistantId = authData?.user?.id;

      // 2. Upsert profile with assistant role and link to doctor
      if (assistantId) {
        await supabase.from('profiles').upsert({
          id: assistantId,
          full_name: name.trim(),
          phone: phone.trim(),
          role: 'assistant',
          assigned_doctor_id: currentUser.id,
          has_diabetes: false,
          has_hypertension: false,
          has_penicillin_allergy: false,
          updated_at: new Date().toISOString(),
        });
      }

      Alert.alert(
        language === 'ar' ? 'تم إنشاء الحساب بنجاح! 🎉' : 'Account Created Successfully! 🎉',
        language === 'ar'
          ? `تم إنشاء حساب المساعد (${name.trim()}).\nيمكن للمساعد تسجيل الدخول برقم الهاتف (${phone.trim()}) أو (${authEmail}) وكلمة المرور (${password.trim()}).`
          : `Assistant account created for ${name.trim()}. Login with ${phone.trim()} and your chosen password.`,
        [
          {
            text: language === 'ar' ? 'مشاركة البيانات' : 'Share Credentials',
            onPress: () => {
              const msg = language === 'ar'
                ? `مرحباً ${name.trim()}،\nتم إنشاء حسابك كمساعد/سكرتارية في تطبيق اسنانجي:\nرقم الدخول: ${phone.trim()}\nكلمة المرور: ${password.trim()}`
                : `Hello ${name.trim()},\nYour clinic assistant account:\nLogin: ${phone.trim()}\nPassword: ${password.trim()}`;
              Linking.openURL(`whatsapp://send?phone=${phone.trim()}&text=${encodeURIComponent(msg)}`).catch(() => {});
            },
          },
          { text: language === 'ar' ? 'تم' : 'Done' },
        ]
      );

      setName('');
      setPhone('');
      setPassword('SmartClinic@2026');
      setModalVisible(false);
      fetchAssistants();
    } catch (err: any) {
      console.error('Error creating assistant:', err);
      Alert.alert(language === 'ar' ? 'خطأ' : 'Error', err.message || 'فشل إنشاء الحساب');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAssistant = (id: string, assistantName: string) => {
    Alert.alert(
      language === 'ar' ? 'تأكيد الحذف' : 'Confirm Removal',
      language === 'ar'
        ? `هل أنت متأكد من إلغاء ربط حساب (${assistantName}) بالعيادة؟`
        : `Are you sure you want to remove ${assistantName}?`,
      [
        { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ar' ? 'حذف' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase
                .from('profiles')
                .update({ assigned_doctor_id: null, role: 'patient' })
                .eq('id', id);
              fetchAssistants();
            } catch (e) {
              console.warn('Error removing assistant:', e);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          {isRTL ? <ArrowRight size={22} color={Colors.white} /> : <ArrowLeft size={22} color={Colors.white} />}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {language === 'ar' ? 'إدارة السكرتارية والمساعدين' : 'Clinic Assistants & Staff'}
          </Text>
          <Text style={styles.headerSub}>
            {language === 'ar' ? 'تنظيم الحجوزات والمواعيد عبر فريق العمل' : 'Manage appointments & bookings via staff'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addIconBtn} onPress={() => setModalVisible(true)}>
          <UserPlus size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Intro Card */}
        <View style={styles.introCard}>
          <View style={styles.introIconBox}>
            <ShieldCheck size={28} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>
              {language === 'ar' ? 'صلاحيات حساب السكرتارية 👩‍💼' : 'Assistant Permissions 👩‍💼'}
            </Text>
            <Text style={styles.introText}>
              {language === 'ar'
                ? 'تستطيع السكرتيرة تنسيق مواعيد العيادة والرد على استفسارات المرضى والاتصال بهم، بينما تظل صلاحيات التشخيص وكتابة الوصفات وإعدادات العيادة حصراً للطبيب.'
                : 'Assistants can coordinate appointments, reply to patient queries and call them, while medical diagnoses remain strictly doctor-only.'}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
          <UserPlus size={20} color={Colors.white} />
          <Text style={styles.createBtnText}>
            {language === 'ar' ? 'إضافة سكرتيرة / مساعد جديد للعيادة' : 'Add New Assistant / Secretary'}
          </Text>
        </TouchableOpacity>

        {/* List Header */}
        <View style={styles.listHeaderRow}>
          <Users size={18} color={Colors.textSecondary} />
          <Text style={styles.listHeaderTitle}>
            {language === 'ar' ? `فريق العمل الحالي (${assistants.length})` : `Active Staff (${assistants.length})`}
          </Text>
        </View>

        {/* Loading */}
        {loading && <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 20 }} />}

        {/* Empty State */}
        {!loading && assistants.length === 0 && (
          <View style={styles.emptyBox}>
            <Users size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>
              {language === 'ar' ? 'لا يوجد مساعدين مسجلين بعد' : 'No Assistants Added Yet'}
            </Text>
            <Text style={styles.emptySub}>
              {language === 'ar'
                ? 'اضغط على زر الإضافة بالأعلى لإنشاء حساب لسكرتيرة العيادة وتمكينها من تنظيم المواعيد.'
                : 'Tap the button above to create an assistant account.'}
            </Text>
          </View>
        )}

        {/* Assistants Cards */}
        {assistants.map((item) => (
          <View key={item.id} style={styles.assistantCard}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{item.fullName.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.assistantName}>{item.fullName}</Text>
              <View style={styles.metaRow}>
                <Phone size={13} color={Colors.textMuted} />
                <Text style={styles.metaText}>{item.phone || 'بدون رقم'}</Text>
              </View>
              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <CheckCircle2 size={11} color={Colors.primaryDark} />
                  <Text style={styles.roleBadgeText}>
                    {language === 'ar' ? 'سكرتارية معتمدة' : 'Verified Assistant'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.actionsCol}>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => {
                  const msg = language === 'ar'
                    ? `مرحباً ${item.fullName}،\nرابط تسجيل الدخول لحساب مساعد العيادة:\nرقم الهاتف: ${item.phone}`
                    : `Login credentials for ${item.fullName}:\nPhone: ${item.phone}`;
                  Linking.openURL(`whatsapp://send?phone=${item.phone}&text=${encodeURIComponent(msg)}`).catch(() => {});
                }}
              >
                <Share2 size={16} color={Colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionIconBtn, { backgroundColor: '#fee2e2' }]}
                onPress={() => handleDeleteAssistant(item.id, item.fullName)}
              >
                <Trash2 size={16} color={Colors.emergency} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal for Adding Assistant */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'ar' ? 'إضافة حساب سكرتيرة / مساعد' : 'Add Assistant / Secretary'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name */}
              <Text style={styles.inputLabel}>{language === 'ar' ? 'الاسم الكامل:' : 'Full Name:'}</Text>
              <View style={styles.inputBox}>
                <User size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder={language === 'ar' ? 'مثال: أ/ سارة محمد' : 'e.g. Sarah Mohamed'}
                  value={name}
                  onChangeText={setName}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

              {/* Phone */}
              <Text style={styles.inputLabel}>{language === 'ar' ? 'رقم الهاتف (لتسجيل الدخول):' : 'Phone Number:'}</Text>
              <View style={styles.inputBox}>
                <Phone size={18} color={Colors.textMuted} />
                <TextInput
                  style={[styles.textInput, { writingDirection: 'ltr' }]}
                  placeholder="01012345678"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              {/* Password */}
              <Text style={styles.inputLabel}>{language === 'ar' ? 'كلمة المرور المؤقتة:' : 'Password:'}</Text>
              <View style={styles.inputBox}>
                <Lock size={18} color={Colors.textMuted} />
                <TextInput
                  style={[styles.textInput, { writingDirection: 'ltr' }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {/* Roles summary */}
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>
                  {language === 'ar'
                    ? '💡 بمجرد الحفظ، ستتمكن السكرتيرة من فتح التطبيق وتسجيل الدخول برقم هاتفها وكلمة المرور المحددة لإدارة مواعيد واستفسارات العيادة مباشرة.'
                    : 'Once created, the assistant can log in with their phone and password to manage clinic schedule.'}
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, creating && { opacity: 0.6 }]}
                disabled={creating}
                onPress={handleCreateAssistant}
              >
                {creating ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <CheckCircle2 size={20} color={Colors.white} />
                    <Text style={styles.submitBtnText}>
                      {language === 'ar' ? 'تأكيد وإنشاء الحساب' : 'Create Assistant Account'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
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
    fontWeight: '900',
    color: Colors.white,
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  addIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  introCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    alignItems: 'center',
    ...Shadows.sm,
  },
  introIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  introText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    ...Shadows.sm,
  },
  createBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 30,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 10,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  assistantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    ...Shadows.sm,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  assistantName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  actionsCol: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 10,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginTop: 14,
  },
  infoBoxText: {
    fontSize: 11,
    color: '#1e40af',
    lineHeight: 16,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 16,
    marginBottom: 20,
    ...Shadows.sm,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});