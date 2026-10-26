import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Stethoscope,
  Users,
  Phone,
  MapPin,
  Calendar,
  MessageSquare,
  DollarSign,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Star,
  Briefcase,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { DoctorAvatar } from '../../components/DoctorAvatar';
import { DoctorProfile } from '../../types/doctor';
import { supabase, isSupabaseConfigured } from '../../services/supabase';

interface AdminDoctorsListScreenProps {
  navigation: any;
}

interface AssistantItem {
  id: string;
  name: string;
  phone: string;
  role: string;
  isActive: boolean;
}

export const AdminDoctorsListScreen: React.FC<AdminDoctorsListScreenProps> = ({ navigation }) => {
  const {
    doctors,
    complaints,
    appointments,
    language,
    isRTL,
    toggleDoctorActiveStatus,
  } = useApp();

  const isAr = language === 'ar';

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Selected Doctor for Detailed Performance Modal
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [assistantsList, setAssistantsList] = useState<AssistantItem[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Filtered Doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      // 1. Status Filter
      if (activeFilter === 'active' && !doc.isAcceptingPatients) return false;
      if (activeFilter === 'suspended' && doc.isAcceptingPatients) return false;

      // 2. Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const name = (doc.profileData?.fullName || '').toLowerCase();
      const specialty = (doc.specialty || '').toLowerCase();
      const address = (doc.clinicAddress || '').toLowerCase();
      const phone = (doc.profileData?.phone || '').toLowerCase();

      return name.includes(q) || specialty.includes(q) || address.includes(q) || phone.includes(q);
    });
  }, [doctors, activeFilter, searchQuery]);

  // Fetch Assistants for Selected Doctor
  const fetchAssistantsForDoctor = useCallback(async (docId: string) => {
    setLoadingAssistants(true);
    setAssistantsList([]);

    if (!isSupabaseConfigured) {
      setLoadingAssistants(false);
      return;
    }

    try {
      // 1. Fetch from clinic_assistants table
      const { data: tableAssistants, error: tableErr } = await supabase
        .from('clinic_assistants')
        .select('*')
        .eq('doctor_id', docId);

      // 2. Fetch from profiles table where assigned_doctor_id == docId
      const { data: profileAssistants, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('assigned_doctor_id', docId);

      const map = new Map<string, AssistantItem>();

      if (tableAssistants && !tableErr) {
        tableAssistants.forEach((a: any) => {
          map.set(a.id, {
            id: a.id,
            name: a.name || 'مساعد عيادة',
            phone: a.phone || '',
            role: 'assistant',
            isActive: a.is_active ?? true,
          });
        });
      }

      if (profileAssistants && !profErr) {
        profileAssistants.forEach((p: any) => {
          if (!map.has(p.id)) {
            map.set(p.id, {
              id: p.id,
              name: p.full_name || 'سكرتارية العيادة',
              phone: p.phone || '',
              role: p.role || 'assistant',
              isActive: true,
            });
          }
        });
      }

      setAssistantsList(Array.from(map.values()));
    } catch (err) {
      console.warn('fetchAssistants error:', err);
    } finally {
      setLoadingAssistants(false);
    }
  }, []);

  // Handle Opening Doctor Drilldown
  const handleOpenDoctorDetail = (doc: DoctorProfile) => {
    setSelectedDoctor(doc);
    fetchAssistantsForDoctor(doc.id);
  };

  // Toggle Doctor Active / Suspended
  const handleToggleStatus = async (doctor: DoctorProfile) => {
    const newStatus = !doctor.isAcceptingPatients;
    const actionName = newStatus
      ? isAr ? 'تفعيل حساب الطبيب' : 'Activate Doctor'
      : isAr ? 'تجميد حساب الطبيب' : 'Suspend Doctor';

    const actionMsg = newStatus
      ? isAr
        ? `هل تريد تفعيل حساب "${doctor.profileData?.fullName || 'الطبيب'}" وإعادة ظهوره للمرضى في المنصة؟`
        : `Are you sure you want to activate "${doctor.profileData?.fullName || 'Doctor'}" and show them to patients?`
      : isAr
        ? `هل تريد تجميد حساب "${doctor.profileData?.fullName || 'الطبيب'}"؟ سيتم إخفاء بروفايل الطبيب ومنع المرضى من حجز مواعيد أو إرسال استشارات له مؤقتاً.`
        : `Are you sure you want to suspend "${doctor.profileData?.fullName || 'Doctor'}"? Their profile will be hidden from patients.`;

    const executeToggle = async () => {
      setIsUpdatingStatus(true);
      try {
        await toggleDoctorActiveStatus(doctor.id, newStatus);
        if (selectedDoctor && selectedDoctor.id === doctor.id) {
          setSelectedDoctor((prev) => (prev ? { ...prev, isAcceptingPatients: newStatus } : null));
        }
      } catch (e) {
        console.warn('Toggle status failed', e);
      } finally {
        setIsUpdatingStatus(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(actionMsg) : true;
      if (confirmed) {
        await executeToggle();
      }
    } else {
      Alert.alert(actionName, actionMsg, [
        { text: isAr ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: actionName,
          style: newStatus ? 'default' : 'destructive',
          onPress: executeToggle,
        },
      ]);
    }
  };

  // Compute Analytics for Selected Doctor
  const doctorAnalytics = useMemo(() => {
    if (!selectedDoctor) return null;

    const docComplaints = complaints.filter((c) => c.doctorId === selectedDoctor.id);
    const diagnosedCount = docComplaints.filter((c) => c.status === 'diagnosed').length;
    const pendingCount = docComplaints.filter((c) => c.status === 'pending').length;
    const urgentCount = docComplaints.filter((c) => c.urgencyLevel === 'emergency').length;

    const docAppointments = appointments.filter((a) => a.doctorId === selectedDoctor.id);
    const upcomingAppts = docAppointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length;
    const completedAppts = docAppointments.filter((a) => a.status === 'completed').length;

    const fee = selectedDoctor.consultationFee || 350;
    const estimatedRevenue = diagnosedCount * fee;

    return {
      totalConsultations: docComplaints.length,
      diagnosedCount,
      pendingCount,
      urgentCount,
      totalAppointments: docAppointments.length,
      upcomingAppts,
      completedAppts,
      estimatedRevenue,
    };
  }, [selectedDoctor, complaints, appointments]);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel={isAr ? 'رجوع' : 'Back'}
        >
          {isRTL ? <ArrowRight size={22} color={Colors.textPrimary} /> : <ArrowLeft size={22} color={Colors.textPrimary} />}
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>
            {isAr ? 'لوحة الأطباء المعتمدين' : 'Approved Doctors Directory'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isAr
              ? `${doctors.length} طبيب مسجل • تحليلات الأداء والرقابة`
              : `${doctors.length} Registered Doctors • Performance & Control`}
          </Text>
        </View>

        <View style={styles.badgeCount}>
          <Text style={styles.badgeCountText}>{doctors.length}</Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <Search size={18} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            isAr
              ? 'البحث باسم الطبيب، التخصص، أو العنوان...'
              : 'Search by doctor name, specialty or clinic...'
          }
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign={isRTL ? 'right' : 'left'}
        />
        {!!searchQuery && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
            {isAr ? `الكل (${doctors.length})` : `All (${doctors.length})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'active' && styles.filterChipActive]}
          onPress={() => setActiveFilter('active')}
        >
          <View style={styles.greenDot} />
          <Text style={[styles.filterChipText, activeFilter === 'active' && styles.filterChipTextActive]}>
            {isAr ? 'النشطين فقط' : 'Active Only'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'suspended' && styles.filterChipActive]}
          onPress={() => setActiveFilter('suspended')}
        >
          <View style={styles.redDot} />
          <Text style={[styles.filterChipText, activeFilter === 'suspended' && styles.filterChipTextActive]}>
            {isAr ? 'الموقوفين' : 'Suspended'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Doctors FlatList */}
      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Stethoscope size={40} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>
              {isAr ? 'لا يوجد أطباء مطابقين للبحث' : 'No matching doctors found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isAr
                ? 'جرّب تغيير كلمات البحث أو تغيير فلتر العرض.'
                : 'Try adjusting your search terms or filter criteria.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const docComplaints = complaints.filter((c) => c.doctorId === item.id);
          const docAppointments = appointments.filter((a) => a.doctorId === item.id);
          const isActive = item.isAcceptingPatients;

          return (
            <View style={[styles.doctorCard, !isActive && styles.doctorCardSuspended]}>
              {/* Doctor Main Header Row */}
              <View style={styles.cardHeader}>
                <DoctorAvatar
                  avatarUrl={item.avatarUrl}
                  name={item.profileData?.fullName}
                  size={52}
                  showBadge={isActive}
                />

                <View style={styles.doctorInfoCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.doctorName} numberOfLines={1}>
                      {item.profileData?.fullName || (isAr ? 'دكتور معتمد' : 'Doctor')}
                    </Text>
                    {isActive ? (
                      <View style={styles.activePill}>
                        <CheckCircle2 size={12} color="#16a34a" />
                        <Text style={styles.activePillText}>{isAr ? 'نشط' : 'Active'}</Text>
                      </View>
                    ) : (
                      <View style={styles.suspendedPill}>
                        <AlertTriangle size={12} color="#dc2626" />
                        <Text style={styles.suspendedPillText}>{isAr ? 'موقوف' : 'Suspended'}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.doctorSpecialty} numberOfLines={1}>
                    {item.specialty || (isAr ? 'استشاري طب وجراحة الأسنان' : 'Dental Specialist')}
                  </Text>

                  <View style={styles.metaRow}>
                    <MapPin size={13} color="#64748b" />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {item.clinicAddress || (isAr ? 'القاهرة، مصر' : 'Cairo, Egypt')}
                    </Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaFee}>
                      {item.consultationFee || 350} {isAr ? 'ج.م' : 'EGP'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Quick Metrics Bar */}
              <View style={styles.cardMetricsBar}>
                <View style={styles.metricItem}>
                  <MessageSquare size={13} color="#0284c7" />
                  <Text style={styles.metricVal}>{docComplaints.length}</Text>
                  <Text style={styles.metricLabel}>{isAr ? 'استشارة' : 'Consults'}</Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricItem}>
                  <Calendar size={13} color="#059669" />
                  <Text style={styles.metricVal}>{docAppointments.length}</Text>
                  <Text style={styles.metricLabel}>{isAr ? 'موعد' : 'Appts'}</Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricItem}>
                  <Star size={13} color="#f59e0b" fill="#f59e0b" />
                  <Text style={styles.metricVal}>{Number(item.rating || 5).toFixed(1)}</Text>
                  <Text style={styles.metricLabel}>{isAr ? 'التقييم' : 'Rating'}</Text>
                </View>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.cardActionsRow}>
                {/* Freeze / Activate Button */}
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    isActive ? styles.btnSuspend : styles.btnActivate,
                  ]}
                  onPress={() => handleToggleStatus(item)}
                  activeOpacity={0.7}
                >
                  {isActive ? (
                    <>
                      <EyeOff size={15} color="#dc2626" />
                      <Text style={styles.btnSuspendText}>
                        {isAr ? 'تجميد الحساب ⏸️' : 'Suspend ⏸️'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Eye size={15} color="#16a34a" />
                      <Text style={styles.btnActivateText}>
                        {isAr ? 'إعادة التفعيل ▶️' : 'Activate ▶️'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Drilldown Details Button */}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnDetails]}
                  onPress={() => handleOpenDoctorDetail(item)}
                  activeOpacity={0.7}
                >
                  <Briefcase size={15} color="#0284c7" />
                  <Text style={styles.btnDetailsText}>
                    {isAr ? 'فحص الأداء الشامل' : 'Doctor Analytics'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* ========================================================= */}
      {/* DOCTOR PERFORMANCE & DRILLDOWN ANALYTICS MODAL */}
      {/* ========================================================= */}
      <Modal
        visible={!!selectedDoctor}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDoctor(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderDoctor}>
                <DoctorAvatar
                  avatarUrl={selectedDoctor?.avatarUrl}
                  name={selectedDoctor?.profileData?.fullName}
                  size={46}
                  showBadge={selectedDoctor?.isAcceptingPatients}
                />
                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Text style={styles.modalDoctorName} numberOfLines={1}>
                    {selectedDoctor?.profileData?.fullName}
                  </Text>
                  <Text style={styles.modalDoctorSub} numberOfLines={1}>
                    {selectedDoctor?.specialty || (isAr ? 'طبيب أسنان' : 'Dentist')}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedDoctor(null)}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {/* Account Status Switch Card */}
              <View
                style={[
                  styles.statusSwitchCard,
                  selectedDoctor?.isAcceptingPatients
                    ? styles.statusCardActive
                    : styles.statusCardSuspended,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusSwitchTitle}>
                    {selectedDoctor?.isAcceptingPatients
                      ? isAr
                        ? 'حساب الطبيب نشط ومتاح للمرضى'
                        : 'Doctor Account is Active'
                      : isAr
                        ? 'حساب الطبيب موقوف مؤقتاً عن الظهور'
                        : 'Doctor Account is Suspended'}
                  </Text>
                  <Text style={styles.statusSwitchDesc}>
                    {selectedDoctor?.isAcceptingPatients
                      ? isAr
                        ? 'يستقبل استشارات جديدة ويظهر في محرك بحث المنصة.'
                        : 'Visible in marketplace & receives consultations.'
                      : isAr
                        ? 'مخفي عن المرضى ولا يمكن حجز مواعيد أو إرسال حالات له.'
                        : 'Hidden from patient search and cannot be booked.'}
                  </Text>
                </View>

                {selectedDoctor && (
                  <TouchableOpacity
                    style={[
                      styles.toggleStatusPill,
                      selectedDoctor.isAcceptingPatients
                        ? { backgroundColor: '#fee2e2' }
                        : { backgroundColor: '#dcfce7' },
                    ]}
                    onPress={() => handleToggleStatus(selectedDoctor)}
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? (
                      <ActivityIndicator size="small" color="#0284c7" />
                    ) : (
                      <Text
                        style={[
                          styles.toggleStatusPillText,
                          selectedDoctor.isAcceptingPatients
                            ? { color: '#dc2626' }
                            : { color: '#16a34a' },
                        ]}
                      >
                        {selectedDoctor.isAcceptingPatients
                          ? isAr
                            ? 'إيقاف مؤقت ⏸️'
                            : 'Suspend ⏸️'
                          : isAr
                            ? 'تفعيل الآن ▶️'
                            : 'Activate ▶️'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Section 1: Associated Clinic Assistants (حسابات السكرتارية) */}
              <View style={styles.sectionBox}>
                <View style={styles.sectionHeaderRow}>
                  <Users size={18} color="#0284c7" />
                  <Text style={styles.sectionTitle}>
                    {isAr ? 'حسابات السكرتارية والمساعدين المرتبطين:' : 'Linked Clinic Assistants:'}
                  </Text>
                </View>

                {loadingAssistants ? (
                  <ActivityIndicator size="small" color="#0284c7" style={{ marginVertical: 14 }} />
                ) : assistantsList.length === 0 ? (
                  <View style={styles.emptyAssistantsBox}>
                    <Text style={styles.emptyAssistantsText}>
                      {isAr
                        ? 'لا توجد حسابات سكرتارية مرتبطة بعيادة هذا الطبيب حالياً.'
                        : 'No assistants registered under this clinic yet.'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.assistantsList}>
                    {assistantsList.map((ast) => (
                      <View key={ast.id} style={styles.assistantRow}>
                        <View style={styles.assistantAvatar}>
                          <Text style={styles.assistantAvatarText}>{ast.name.charAt(0)}</Text>
                        </View>
                        <View style={{ flex: 1, marginHorizontal: 8 }}>
                          <Text style={styles.assistantName}>{ast.name}</Text>
                          <Text style={styles.assistantPhone}>{ast.phone || 'بدون رقم مسجل'}</Text>
                        </View>
                        <View style={styles.assistantBadge}>
                          <Text style={styles.assistantBadgeText}>{isAr ? 'سكرتارية مفعلة' : 'Active Assistant'}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Section 2: Consultations Performance (إحصائيات الاستشارات) */}
              <View style={styles.sectionBox}>
                <View style={styles.sectionHeaderRow}>
                  <MessageSquare size={18} color="#9333ea" />
                  <Text style={styles.sectionTitle}>
                    {isAr ? 'أداء الاستشارات الطبية والردود:' : 'Consultation Performance:'}
                  </Text>
                </View>

                <View style={styles.analyticsGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricCardNum}>{doctorAnalytics?.totalConsultations || 0}</Text>
                    <Text style={styles.metricCardLabel}>{isAr ? 'إجمالي الاستشارات' : 'Total Consults'}</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Text style={[styles.metricCardNum, { color: '#16a34a' }]}>
                      {doctorAnalytics?.diagnosedCount || 0}
                    </Text>
                    <Text style={styles.metricCardLabel}>{isAr ? 'تم تشخيصها ✅' : 'Diagnosed'}</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Text style={[styles.metricCardNum, { color: '#f59e0b' }]}>
                      {doctorAnalytics?.pendingCount || 0}
                    </Text>
                    <Text style={styles.metricCardLabel}>{isAr ? 'قيد الانتظار ⏳' : 'Pending'}</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Text style={[styles.metricCardNum, { color: '#dc2626' }]}>
                      {doctorAnalytics?.urgentCount || 0}
                    </Text>
                    <Text style={styles.metricCardLabel}>{isAr ? 'حالات طارئة 🚨' : 'Emergency'}</Text>
                  </View>
                </View>
              </View>

              {/* Section 3: Appointments Performance (المواعيد المحجوزة) */}
              <View style={styles.sectionBox}>
                <View style={styles.sectionHeaderRow}>
                  <Calendar size={18} color="#059669" />
                  <Text style={styles.sectionTitle}>
                    {isAr ? 'المواعيد والكشوفات المحجوزة بالعيادة:' : 'Clinic Appointments:'}
                  </Text>
                </View>

                <View style={styles.analyticsGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricCardNum}>{doctorAnalytics?.totalAppointments || 0}</Text>
                    <Text style={styles.metricCardLabel}>{isAr ? 'إجمالي المواعيد' : 'Total Appts'}</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Text style={[styles.metricCardNum, { color: '#0284c7' }]}>
                      {doctorAnalytics?.upcomingAppts || 0}
                    </Text>
                    <Text style={styles.metricCardLabel}>{isAr ? 'مواعيد قادمة 🕒' : 'Upcoming'}</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Text style={[styles.metricCardNum, { color: '#10b981' }]}>
                      {doctorAnalytics?.completedAppts || 0}
                    </Text>
                    <Text style={styles.metricCardLabel}>{isAr ? 'كشوفات مكتملة 🦷' : 'Completed'}</Text>
                  </View>
                </View>
              </View>

              {/* Section 4: Estimated Financials */}
              <View style={styles.financialCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={20} color="#065f46" />
                  <Text style={styles.financialTitle}>
                    {isAr ? 'النشاط المالي التقديري للاستشارات:' : 'Estimated Consultation Volume:'}
                  </Text>
                </View>
                <Text style={styles.financialAmount}>
                  {doctorAnalytics?.estimatedRevenue?.toLocaleString() || 0} {isAr ? 'ج.م' : 'EGP'}
                </Text>
                <Text style={styles.financialNote}>
                  {isAr
                    ? `مبني على ${doctorAnalytics?.diagnosedCount || 0} استشارة مكتملة بسعر كشف ${selectedDoctor?.consultationFee || 350} ج.م`
                    : `Based on ${doctorAnalytics?.diagnosedCount || 0} completed diagnoses`}
                </Text>
              </View>

              {/* Preview Public Profile Button */}
              {selectedDoctor && (
                <TouchableOpacity
                  style={styles.previewBtn}
                  onPress={() => {
                    const docId = selectedDoctor.id;
                    setSelectedDoctor(null);
                    navigation.navigate('DoctorProfile', { doctorId: docId });
                  }}
                >
                  <ExternalLink size={16} color="#ffffff" />
                  <Text style={styles.previewBtnText}>
                    {isAr ? 'معاينة صفحة الطبيب كما يراها المريض' : 'Preview Doctor Profile Page'}
                  </Text>
                </TouchableOpacity>
              )}
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
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  badgeCount: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCountText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  filterChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
    marginRight: 6,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
    marginRight: 6,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  doctorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.sm,
  },
  doctorCardSuspended: {
    borderColor: '#fca5a5',
    backgroundColor: '#fffafb',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorInfoCol: {
    flex: 1,
    marginHorizontal: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  suspendedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  suspendedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  doctorSpecialty: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '600',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 3,
    maxWidth: 140,
  },
  metaDot: {
    marginHorizontal: 5,
    color: '#94a3b8',
  },
  metaFee: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  cardMetricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 8,
    marginTop: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#cbd5e1',
  },
  cardActionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  btnSuspend: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  btnSuspendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  btnActivate: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  btnActivateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  btnDetails: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  btnDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalHeaderDoctor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalDoctorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalDoctorSub: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '600',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  modalScroll: {
    padding: 16,
    gap: 14,
  },
  statusSwitchCard: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  statusCardActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  statusCardSuspended: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  statusSwitchTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusSwitchDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  toggleStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 10,
  },
  toggleStatusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  sectionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyAssistantsBox: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyAssistantsText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  assistantsList: {
    gap: 8,
  },
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  assistantName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  assistantPhone: {
    fontSize: 11,
    color: '#64748b',
  },
  assistantBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  assistantBadgeText: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '700',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricCardNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  metricCardLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  financialCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  financialTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065f46',
  },
  financialAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#047857',
    marginTop: 6,
  },
  financialNote: {
    fontSize: 11,
    color: '#059669',
    marginTop: 2,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 6,
  },
  previewBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
