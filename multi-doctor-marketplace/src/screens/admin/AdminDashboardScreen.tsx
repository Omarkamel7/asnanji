import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import {
  ShieldCheck,
  Users,
  Stethoscope,
  Calendar,
  MessageSquare,
  Clock,
  TrendingUp,
  AlertCircle,
  Activity,
  CheckCircle2,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

export const AdminDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    doctors,
    doctorApplications,
    complaints,
    appointments,
    language,
    fetchDoctors,
    fetchDoctorApplications,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDoctors?.(),
        fetchDoctorApplications?.(),
      ]);
    } catch (e) {
      console.warn('Admin refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const pendingApps = doctorApplications.filter((a) => a.status === 'pending');
  const activeDoctors = doctors.filter((d) => d.isAcceptingPatients !== false);
  const totalAppointments = appointments.length;
  const totalConsultations = complaints.length;
  const pendingConsultations = complaints.filter((c) => c.status === 'pending').length;

  const isRTL = language === 'ar';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Admin Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.badge}>
              <ShieldCheck size={14} color={Colors.white} />
              <Text style={styles.badgeText}>
                {isRTL ? 'إدارة المنصة المركزية' : 'Super Admin'}
              </Text>
            </View>
            <View style={styles.statusLive}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{isRTL ? 'متصل مباشر' : 'Live'}</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>
            {isRTL ? 'لوحة تحكم أسنانجي' : 'Asnanji Admin Portal'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isRTL
              ? 'متابعة شاملة للأطباء، استشارات المرضى، وجداول العيادات'
              : 'Full overview of doctors, patient triage, and clinic operations'}
          </Text>
        </View>

        {/* Pending Applications Alert Banner */}
        {pendingApps.length > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => navigation.navigate('AdminApplications')}
            activeOpacity={0.8}
          >
            <View style={styles.alertIconCircle}>
              <AlertCircle size={22} color={Colors.emergency} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {isRTL
                  ? `يوجد ${pendingApps.length} طلب انضمام طبيب بانتظار المراجعة!`
                  : `${pendingApps.length} Doctor Application(s) Pending Review!`}
              </Text>
              <Text style={styles.alertSub}>
                {isRTL
                  ? 'اضغط هنا لفحص ملفات الأطباء والموافقة أو الرفض'
                  : 'Tap to inspect doctor credentials and verify registration'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Primary KPIs Grid */}
        <Text style={styles.sectionHeader}>
          {isRTL ? '📊 مؤشرات الأداء الحية' : '📊 Realtime Platform Metrics'}
        </Text>

        <View style={styles.kpiGrid}>
          {/* Doctors */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('AdminDoctorsList')}
            activeOpacity={0.7}
          >
            <View style={[styles.kpiIconBox, { backgroundColor: '#e0f2fe' }]}>
              <Stethoscope size={20} color="#0284c7" />
            </View>
            <Text style={styles.kpiValue}>{doctors.length}</Text>
            <Text style={styles.kpiLabel}>
              {isRTL ? 'أطباء معتمدون' : 'Active Doctors'}
            </Text>
            <Text style={styles.kpiSub}>
              {isRTL ? `${activeDoctors.length} متاحين الآن ➔` : `${activeDoctors.length} available ➔`}
            </Text>
          </TouchableOpacity>

          {/* Pending Applications */}
          <TouchableOpacity
            style={[styles.kpiCard, pendingApps.length > 0 && styles.kpiCardHighlight]}
            onPress={() => navigation.navigate('AdminApplications')}
            activeOpacity={0.7}
          >
            <View style={[styles.kpiIconBox, { backgroundColor: '#fef3c7' }]}>
              <Clock size={20} color="#d97706" />
            </View>
            <Text style={[styles.kpiValue, pendingApps.length > 0 && { color: '#d97706' }]}>
              {pendingApps.length}
            </Text>
            <Text style={styles.kpiLabel}>
              {isRTL ? 'طلبات انضمام معلقة' : 'Pending Approvals'}
            </Text>
            <Text style={styles.kpiSub}>
              {isRTL ? 'تحتاج قرار الإدارة' : 'Action Required'}
            </Text>
          </TouchableOpacity>

          {/* Consultations */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#f3e8ff' }]}>
              <MessageSquare size={20} color="#9333ea" />
            </View>
            <Text style={styles.kpiValue}>{totalConsultations}</Text>
            <Text style={styles.kpiLabel}>
              {isRTL ? 'استشارات رقمية' : 'Total Consultations'}
            </Text>
            <Text style={styles.kpiSub}>
              {isRTL ? `${pendingConsultations} قيد الانتظار` : `${pendingConsultations} pending`}
            </Text>
          </View>

          {/* Appointments */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#dcfce7' }]}>
              <Calendar size={20} color="#16a34a" />
            </View>
            <Text style={styles.kpiValue}>{totalAppointments}</Text>
            <Text style={styles.kpiLabel}>
              {isRTL ? 'مواعيد محجوزة' : 'Appointments'}
            </Text>
            <Text style={styles.kpiSub}>
              {isRTL ? 'عبر كل العيادات' : 'Platform-wide'}
            </Text>
          </View>
        </View>

        {/* System Health Section */}
        <Text style={styles.sectionHeader}>
          {isRTL ? '⚡ حالة النظام والخدمات السحابية' : '⚡ System & Cloud Status'}
        </Text>

        <View style={styles.systemCard}>
          <View style={styles.systemRow}>
            <View style={styles.systemRowLeft}>
              <Activity size={18} color={Colors.primary} />
              <Text style={styles.systemName}>
                {isRTL ? 'قاعدة البيانات (Supabase PostgreSQL)' : 'Supabase PostgreSQL DB'}
              </Text>
            </View>
            <View style={styles.statusPillActive}>
              <CheckCircle2 size={12} color="#16a34a" />
              <Text style={styles.statusPillTextActive}>
                {isRTL ? 'متصل' : 'Connected'}
              </Text>
            </View>
          </View>

          <View style={styles.systemDivider} />

          <View style={styles.systemRow}>
            <View style={styles.systemRowLeft}>
              <TrendingUp size={18} color="#0284c7" />
              <Text style={styles.systemName}>
                {isRTL ? 'تحديثات الرسائل الفورية (Realtime Engine)' : 'Realtime Messaging Engine'}
              </Text>
            </View>
            <View style={styles.statusPillActive}>
              <CheckCircle2 size={12} color="#16a34a" />
              <Text style={styles.statusPillTextActive}>
                {isRTL ? 'نشط' : 'Active'}
              </Text>
            </View>
          </View>

          <View style={styles.systemDivider} />

          <View style={styles.systemRow}>
            <View style={styles.systemRowLeft}>
              <Users size={18} color="#9333ea" />
              <Text style={styles.systemName}>
                {isRTL ? 'حماية الحسابات (Multi-Role Auth)' : 'Multi-Role Security'}
              </Text>
            </View>
            <View style={styles.statusPillActive}>
              <CheckCircle2 size={12} color="#16a34a" />
              <Text style={styles.statusPillTextActive}>
                {isRTL ? 'مؤمن' : 'Secured'}
              </Text>
            </View>
          </View>
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
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...Shadows.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  statusLive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  liveText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    gap: 12,
    ...Shadows.sm,
  },
  alertIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.emergency,
    marginBottom: 2,
  },
  alertSub: {
    fontSize: 12,
    color: '#991b1b',
    lineHeight: 16,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
    marginTop: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  kpiCardHighlight: {
    borderColor: '#f59e0b',
    borderWidth: 1.5,
  },
  kpiIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  kpiSub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  systemCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  systemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  systemRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  systemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  systemDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  statusPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusPillTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
});
