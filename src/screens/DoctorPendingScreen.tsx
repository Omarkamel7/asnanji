import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Clock,
  ShieldCheck,
  Phone,
  MessageCircle,
  RefreshCw,
  LogOut,
  CheckCircle,
  Stethoscope,
} from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';

export const DoctorPendingScreen: React.FC = () => {
  const { currentUser, setRole, signOut, language } = useApp();
  const isRTL = language === 'ar';
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    if (!currentUser?.id) return;
    setChecking(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (data && data.role === 'doctor') {
        setRole('doctor');
        Alert.alert(
          isRTL ? 'تهانينا! تم الاعتماد' : 'Congratulations!',
          isRTL
            ? 'تم اعتماد حسابك كطبيب بنجاح! يتم الآن توجيهك إلى لوحة التحكم الخاصة بك.'
            : 'Your doctor account has been approved! Redirecting...'
        );
      } else {
        Alert.alert(
          isRTL ? 'ما زال قيد المراجعة' : 'Still Under Review',
          isRTL
            ? 'طلبك ما زال قيد الفحص والتدقيق من قبل إدارة المنصة. سنقوم بإشعارك فور الاعتماد.'
            : 'Your credentials are still being verified. We will notify you once approved.'
        );
      }
    } catch (err: any) {
      console.warn('Check status error:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('https://wa.me/201000000000?text=استفسار%20عن%20طلب%20انضمام%20طبيب');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.iconCircle}>
            <Clock size={40} color="#d97706" />
          </View>
          <Text style={styles.heroTitle}>
            {isRTL ? 'طلبك قيد المراجعة والتدقيق' : 'Application Under Review'}
          </Text>
          <Text style={styles.heroSub}>
            {isRTL
              ? `مرحباً د. ${currentUser?.fullName || ''}. تم استلام بيانات انضمامك إلى منصة أسنانجي بنجاح، ويقوم فريق الإدارة حالياً بمراجعة بيانات ترخيص مزاولة المهنة.`
              : `Welcome Dr. ${currentUser?.fullName || ''}. Your application has been received and is pending verification.`}
          </Text>
        </View>

        {/* Status Tracker */}
        <View style={styles.trackerCard}>
          <Text style={styles.trackerTitle}>
            {isRTL ? '📌 خطوات التفعيل والاعتماد' : '📌 Verification Progress'}
          </Text>

          {/* Step 1 */}
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotDone]}>
              <CheckCircle size={14} color="white" />
            </View>
            <View style={styles.stepTextBox}>
              <Text style={styles.stepHead}>
                {isRTL ? '1. استلام الطلب وإنشاء الحساب' : '1. Account Created'}
              </Text>
              <Text style={styles.stepDesc}>
                {isRTL
                  ? `تم تسجيل الحساب بالبريد: ${currentUser?.email || ''}`
                  : `Registered with ${currentUser?.email || ''}`}
              </Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          {/* Step 2 */}
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotActive]}>
              <Clock size={14} color="white" />
            </View>
            <View style={styles.stepTextBox}>
              <Text style={[styles.stepHead, { color: '#d97706' }]}>
                {isRTL ? '2. مراجعة الترخيص وتصريح النقابة (الآن)' : '2. Credential Verification (Current)'}
              </Text>
              <Text style={styles.stepDesc}>
                {isRTL
                  ? 'يتم التحقق من رقم القيد بالنقابة وصحة البيانات المرفقة.'
                  : 'Reviewing syndicate registration and clinic address.'}
              </Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          {/* Step 3 */}
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotPending]}>
              <Stethoscope size={14} color="#94a3b8" />
            </View>
            <View style={styles.stepTextBox}>
              <Text style={[styles.stepHead, { color: '#64748b' }]}>
                {isRTL ? '3. النشر في دليل الأطباء وبدء استقبال الحالات' : '3. Go Live & Receive Patients'}
              </Text>
              <Text style={styles.stepDesc}>
                {isRTL
                  ? 'فور الاعتماد ستتمكن من تعديل عيادتك وإضافة الخدمات واستقبال الحالات.'
                  : 'Receive patient consultations and manage appointments.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={handleCheckStatus}
            disabled={checking}
            activeOpacity={0.8}
          >
            {checking ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <RefreshCw size={18} color="white" />
                <Text style={styles.refreshBtnText}>
                  {isRTL ? 'تحديث حالة الطلب الآن' : 'Check Status Now'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={handleContactSupport}
            activeOpacity={0.8}
          >
            <MessageCircle size={18} color="#25D366" />
            <Text style={styles.whatsappBtnText}>
              {isRTL ? 'تواصل مع الدعم الفني لتسريع الاعتماد' : 'Contact Support'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={() => signOut()}
            activeOpacity={0.8}
          >
            <LogOut size={16} color="#dc2626" />
            <Text style={styles.signOutText}>
              {isRTL ? 'تسجيل الخروج' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  trackerCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  trackerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepDotDone: {
    backgroundColor: '#16a34a',
  },
  stepDotActive: {
    backgroundColor: '#d97706',
  },
  stepDotPending: {
    backgroundColor: '#e2e8f0',
  },
  stepTextBox: {
    flex: 1,
  },
  stepHead: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
    marginVertical: 4,
  },
  actions: {
    gap: 12,
  },
  refreshBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    ...Shadows.sm,
  },
  refreshBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
  whatsappBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  whatsappBtnText: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  signOutText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '700',
  },
});
