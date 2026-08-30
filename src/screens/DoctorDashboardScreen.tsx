import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { SkeletonConsultationCard } from '../components/SkeletonCard';
import { useFocusEffect } from '@react-navigation/native';
import {
  Stethoscope,
  Clock,
  AlertCircle,
  CheckCircle,
  Calendar,
  ChevronRight,
  ShieldAlert,
  Users,
  Activity,
  MessageCircle,
  Layers,
  Image as ImageIcon,
  Settings,
  Sparkles,
} from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface DoctorDashboardScreenProps {
  navigation: any;
}

export const DoctorDashboardScreen: React.FC<DoctorDashboardScreenProps> = ({
  navigation,
}) => {
  const {
    t,
    language,
    complaints,
    appointments,
    doctorInbox,
    setRole,
    isRTL,
    refreshClinicData,
    currentUser,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'diagnosed'>('all');

  useFocusEffect(
    useCallback(() => {
      refreshClinicData().catch((e) =>
        console.warn('DoctorDashboard focus refresh error:', e)
      );
    }, [])
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser?.id) return;

    const channel = supabase
      .channel('doctor_realtime_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultations',
          filter: `doctor_id=eq.${currentUser.id}`,
        },
        (payload) => {
          Alert.alert(
            language === 'ar' ? 'استشارة جديدة' : 'New Consultation',
            language === 'ar'
              ? 'قام مريض جديد بإرسال طلب استشارة لعيادتك'
              : 'A patient has submitted a new consultation request.'
          );
          refreshClinicData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshClinicData();
    } catch (e) {
      console.warn('DoctorDashboard onRefresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const pendingComplaints = complaints.filter((c) => c.status === 'pending');
  const diagnosedComplaints = complaints.filter(
    (c) => c.status === 'diagnosed' || c.status === 'appointment_booked'
  );

  const filteredComplaints = complaints.filter((c) => {
    if (activeTab === 'pending') return c.status === 'pending';
    if (activeTab === 'diagnosed')
      return c.status === 'diagnosed' || c.status === 'appointment_booked';
    return true;
  });

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
      case 'urgent':
        return {
          bg: Colors.emergencyBg,
          text: Colors.emergency,
          label: language === 'ar' ? 'عاجل 🚨' : 'Emergency 🚨',
        };
      case 'moderate':
        return {
          bg: Colors.urgentBg,
          text: Colors.urgent,
          label: language === 'ar' ? 'متوسط ⚠️' : 'Moderate ⚠️',
        };
      default:
        return {
          bg: Colors.routineBg,
          text: Colors.routine,
          label: language === 'ar' ? 'روتيني ⏳' : 'Routine ⏳',
        };
    }
  };

  return (
    <ScrollView
      style={styles.container}
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
      {/* Doctor Header Banner */}
      <View style={styles.doctorBanner}>
        <View style={styles.bannerHeader}>
          <View style={styles.avatarCircle}>
            <Stethoscope size={30} color={Colors.white} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>
              {language === 'ar' ? `مرحباً ${currentUser.fullName || 'د. كريم'}` : `Welcome ${currentUser.fullName}`}
            </Text>
            <Text style={styles.bannerSub}>
              {language === 'ar'
                ? 'لوحة تحكم عيادتك وإدارة الاستشارات والمواعيد'
                : 'Manage your clinic, consultations and patient schedule'}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumAlert}>{pendingComplaints.length}</Text>
            <Text style={styles.statLabel}>
              {language === 'ar' ? 'قيد الانتظار' : 'Pending'}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{diagnosedComplaints.length}</Text>
            <Text style={styles.statLabel}>
              {language === 'ar' ? 'تم التشخيص' : 'Diagnosed'}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{appointments.length}</Text>
            <Text style={styles.statLabel}>
              {language === 'ar' ? 'مواعيد اليوم' : 'Appointments'}
            </Text>
          </View>
        </View>
      </View>

      {/* Doctor Management Hub Actions */}
      <View style={styles.managementSection}>
        <Text style={styles.sectionTitle}>
          {language === 'ar' ? '⚙️ التحكم في العيادة والخدمات والمحتوى:' : '⚙️ Clinic & Content Management:'}
        </Text>
        <View style={styles.managementGrid}>
          {/* Settings Card */}
          <TouchableOpacity
            style={styles.manageCard}
            onPress={() => navigation.navigate('DoctorSettings')}
          >
            <View style={[styles.manageIconCircle, { backgroundColor: '#e0f2fe' }]}>
              <Settings size={20} color={Colors.primary} />
            </View>
            <Text style={styles.manageCardTitle}>
              {language === 'ar' ? 'إعدادات وتوافر العيادة' : 'Clinic & Profile Settings'}
            </Text>
            <Text style={styles.manageCardSub}>
              {language === 'ar' ? 'التوافر، الأسعار، وأوقات العمل' : 'Availability, fees & hours'}
            </Text>
          </TouchableOpacity>

          {/* Services Card */}
          <TouchableOpacity
            style={styles.manageCard}
            onPress={() => navigation.navigate('ManageServices')}
          >
            <View style={[styles.manageIconCircle, { backgroundColor: '#dcfce7' }]}>
              <Layers size={20} color="#16a34a" />
            </View>
            <Text style={styles.manageCardTitle}>
              {language === 'ar' ? 'الخدمات والأسعار' : 'Services & Pricing'}
            </Text>
            <Text style={styles.manageCardSub}>
              {language === 'ar' ? 'إضافة وتعديل خدمات الكشف' : 'Manage clinic services & prices'}
            </Text>
          </TouchableOpacity>

          {/* Portfolio Card */}
          <TouchableOpacity
            style={styles.manageCard}
            onPress={() => navigation.navigate('ManagePortfolio')}
          >
            <View style={[styles.manageIconCircle, { backgroundColor: '#f3e8ff' }]}>
              <ImageIcon size={20} color="#7e22ce" />
            </View>
            <Text style={styles.manageCardTitle}>
              {language === 'ar' ? 'معرض الحالات (Before/After)' : 'Portfolio (Before/After)'}
            </Text>
            <Text style={styles.manageCardSub}>
              {language === 'ar' ? 'إضافة صور وتجارب العلاج' : 'Upload case transformations'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Triage Filter Tabs */}
      <View style={styles.triageSectionHeader}>
        <Text style={styles.sectionTitle}>
          {language === 'ar' ? '📥 استشارات وفرز الحالات الواردة:' : '📥 Incoming Consultations:'}
        </Text>
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'all' && styles.filterTabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'all' && styles.filterTabTextActive,
              ]}
            >
              {language === 'ar' ? 'الكل' : 'All'} ({complaints.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeTab === 'pending' && styles.filterTabActive,
            ]}
            onPress={() => setActiveTab('pending')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'pending' && styles.filterTabTextActive,
              ]}
            >
              {language === 'ar' ? 'قيد الانتظار ⏳' : 'Pending ⏳'} ({pendingComplaints.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              activeTab === 'diagnosed' && styles.filterTabActive,
            ]}
            onPress={() => setActiveTab('diagnosed')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'diagnosed' && styles.filterTabTextActive,
              ]}
            >
              {language === 'ar' ? 'تم التشخيص ✔️' : 'Diagnosed ✔️'} ({diagnosedComplaints.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyTitle}>
            {language === 'ar'
              ? 'لا توجد استشارات جديدة في هذا القسم'
              : 'No consultations found in this category'}
          </Text>
        </View>
      ) : (
        <View style={styles.complaintsList}>
          {filteredComplaints.map((item) => {
            const urgency = getUrgencyBadge(item.urgencyLevel);
            const isDiagnosed =
              item.status === 'diagnosed' || item.status === 'appointment_booked';

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.complaintCard}
                onPress={() =>
                  navigation.navigate('DoctorConsultationDetail', {
                    complaintId: item.id,
                  })
                }
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.patientInfoRow}>
                    <View style={styles.patientAvatarSmall}>
                      <Text style={styles.patientAvatarChar}>
                        {item.patientName ? item.patientName.charAt(0) : 'م'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.patientNameText}>{item.patientName}</Text>
                      <Text style={styles.patientPhoneText}>{item.patientPhone}</Text>
                    </View>
                  </View>

                  <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
                    <Text style={[styles.urgencyBadgeText, { color: urgency.text }]}>
                      {urgency.label}
                    </Text>
                  </View>
                </View>

                {/* Description Preview */}
                {!!item.description && (
                  <Text style={styles.descriptionPreview} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}

                {/* Card Footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.painLevelPill}>
                    <Text style={styles.painLevelPillText}>
                      {language === 'ar' ? 'شدة الألم:' : 'Pain:'} {item.painLevel} / 10
                    </Text>
                  </View>

                  <View style={styles.actionBtnRow}>
                    <Text style={styles.actionBtnText}>
                      {isDiagnosed
                        ? language === 'ar'
                          ? 'عرض التشخيص 👈'
                          : 'View Diagnosis 👈'
                        : language === 'ar'
                        ? 'فحص وتشخيص 🩺'
                        : 'Examine & Diagnose 🩺'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

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
  doctorBanner: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    ...Shadows.md,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
  },
  bannerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumAlert: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fbbf24',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.white,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  managementSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  managementGrid: {
    gap: 8,
  },
  manageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    gap: 12,
    ...Shadows.sm,
  },
  manageIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  manageCardSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  triageSectionHeader: {
    marginBottom: 12,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  complaintsList: {
    gap: 10,
  },
  complaintCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    ...Shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  patientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patientAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAvatarChar: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  patientNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  patientPhoneText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  urgencyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  descriptionPreview: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  painLevelPill: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  painLevelPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  actionBtnRow: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    ...Shadows.sm,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
