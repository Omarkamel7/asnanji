import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
} from 'react-native';
import {
  UserCheck,
  UserX,
  FileText,
  Phone,
  Mail,
  MapPin,
  Award,
  DollarSign,
  Calendar,
  X,
  ExternalLink,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { DoctorApplication } from '../../types';
import { DoctorAvatar } from '../../components/DoctorAvatar';

export const AdminDoctorApplicationsScreen: React.FC = () => {
  const {
    doctorApplications,
    reviewDoctorApplication,
    fetchDoctorApplications,
    language,
  } = useApp();

  const isRTL = language === 'ar';

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedApp, setSelectedApp] = useState<DoctorApplication | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReasonModal, setRejectReasonModal] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState('');

  const filteredApplications = doctorApplications.filter((app) => {
    if (activeTab === 'all') return true;
    return app.status === activeTab;
  });

  const handleApprove = (app: DoctorApplication) => {
    Alert.alert(
      isRTL ? 'تأكيد اعتماد الطبيب' : 'Confirm Doctor Approval',
      isRTL
        ? `هل أنت متأكد من رغبتك في اعتماد د. ${app.fullName}؟ سيتم تفعيل حسابه كطبيب فورا وإضافته لدليل الأطباء.`
        : `Are you sure you want to approve Dr. ${app.fullName}? Their account will be activated immediately.`,
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'اعتماد ونشر' : 'Approve & Activate',
          style: 'default',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await reviewDoctorApplication(app.id, 'approved');
              setSelectedApp(null);
              Alert.alert(
                isRTL ? 'تم الاعتماد بنجاح' : 'Approved Successfully',
                isRTL
                  ? `تم تفعيل حساب د. ${app.fullName}. يمكنه الآن تسجيل الدخول مباشرة والبدء في استقبال المرضى.`
                  : `Dr. ${app.fullName} has been approved and can now sign in.`
              );
            } catch (err: any) {
              Alert.alert(isRTL ? 'خطأ' : 'Error', err?.message || 'Failed to approve');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenRejectModal = () => {
    setRejectReasonText('');
    setRejectReasonModal(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedApp) return;
    setIsProcessing(true);
    try {
      await reviewDoctorApplication(selectedApp.id, 'rejected', rejectReasonText.trim());
      setRejectReasonModal(false);
      setSelectedApp(null);
      Alert.alert(
        isRTL ? 'تم رفض الطلب' : 'Application Rejected',
        isRTL ? 'تم تحديث حالة الطلب إلى مرفوض.' : 'Application marked as rejected.'
      );
    } catch (err: any) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', err?.message || 'Failed to reject');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWhatsApp = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${clean}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://wa.me/${clean}`);
      }
    });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const renderStatusBadge = (status: DoctorApplication['status']) => {
    switch (status) {
      case 'approved':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}>
            <CheckCircle size={12} color="#16a34a" />
            <Text style={[styles.statusBadgeText, { color: '#16a34a' }]}>
              {isRTL ? 'معتمد' : 'Approved'}
            </Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#fee2e2' }]}>
            <AlertCircle size={12} color="#dc2626" />
            <Text style={[styles.statusBadgeText, { color: '#dc2626' }]}>
              {isRTL ? 'مرفوض' : 'Rejected'}
            </Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#fef3c7' }]}>
            <Clock size={12} color="#d97706" />
            <Text style={[styles.statusBadgeText, { color: '#d97706' }]}>
              {isRTL ? 'قيد المراجعة' : 'Pending'}
            </Text>
          </View>
        );
    }
  };

  const renderDegreeText = (degree: string) => {
    switch (degree) {
      case 'professor':
        return isRTL ? 'أستاذ دكتور' : 'Professor';
      case 'consultant':
        return isRTL ? 'استشاري' : 'Consultant';
      default:
        return isRTL ? 'أخصائي' : 'Specialist';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isRTL ? 'طلبات انضمام الأطباء' : 'Doctor Applications'}
          </Text>
          <Text style={styles.headerSub}>
            {isRTL
              ? 'فحص استمارات الأطباء، مراجعة التراخيص، واعتماد الحسابات'
              : 'Inspect doctor registrations, credentials, and approve access'}
          </Text>

          {/* Filter Tabs */}
          <View style={styles.tabBar}>
            {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => {
              const count =
                tab === 'all'
                  ? doctorApplications.length
                  : doctorApplications.filter((a) => a.status === tab).length;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text
                    style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
                  >
                    {tab === 'pending'
                      ? isRTL ? 'قيد المراجعة' : 'Pending'
                      : tab === 'approved'
                      ? isRTL ? 'معتمدة' : 'Approved'
                      : tab === 'rejected'
                      ? isRTL ? 'مرفوضة' : 'Rejected'
                      : isRTL ? 'الكل' : 'All'}
                    {` (${count})`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Applications List */}
        <FlatList
          data={filteredApplications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FileText size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>
                {isRTL ? 'لا توجد طلبات في هذا القسم' : 'No applications found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isRTL
                  ? 'عندما يقدم طبيب استمارة انضمام ستظهر هنا بكامل تفاصيلها.'
                  : 'New doctor applications will appear here with full details.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setSelectedApp(item)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <DoctorAvatar name={item.fullName} size={48} />
                <View style={styles.cardHeaderText}>
                  <View style={styles.nameRow}>
                    <Text style={styles.doctorName}>د. {item.fullName}</Text>
                    {renderStatusBadge(item.status)}
                  </View>
                  <Text style={styles.doctorSpecialty}>
                    {item.specialty} • {renderDegreeText(item.degree)}
                  </Text>
                  <Text style={styles.doctorAddress}>
                    📍 {item.clinicAddress || item.governorate || (isRTL ? 'غير محدد' : 'Not set')}
                  </Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>
                  📅 {new Date(item.createdAt).toLocaleDateString('ar-EG')}
                </Text>
                <View style={styles.cardInspectAction}>
                  <Text style={styles.cardInspectText}>
                    {isRTL ? '🔍 فتح الاستمارة كاملة' : '🔍 Inspect Details'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Application Details Modal */}
        <Modal
          visible={!!selectedApp}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedApp(null)}
        >
          {selectedApp && (
            <SafeAreaView style={styles.modalSafeArea}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedApp(null)}
                >
                  <X size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {isRTL ? 'استمارة انضمام الطبيب' : 'Doctor Application'}
                </Text>
                <View style={{ width: 36 }} />
              </View>

              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Doctor Identity Header */}
                <View style={styles.doctorProfileHero}>
                  <DoctorAvatar name={selectedApp.fullName} size={70} />
                  <Text style={styles.heroName}>د. {selectedApp.fullName}</Text>
                  <Text style={styles.heroSub}>
                    {selectedApp.specialty} • {renderDegreeText(selectedApp.degree)}
                  </Text>
                  <View style={{ marginTop: 8 }}>
                    {renderStatusBadge(selectedApp.status)}
                  </View>
                </View>

                {/* Direct Contact Buttons */}
                <View style={styles.quickContactRow}>
                  <TouchableOpacity
                    style={[styles.quickContactBtn, { backgroundColor: '#25D366' }]}
                    onPress={() => handleWhatsApp(selectedApp.phone)}
                  >
                    <MessageCircle size={18} color="white" />
                    <Text style={styles.quickContactText}>
                      {isRTL ? 'مراسلة عبر واتساب' : 'WhatsApp'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickContactBtn, { backgroundColor: Colors.primary }]}
                    onPress={() => handleCall(selectedApp.phone)}
                  >
                    <Phone size={18} color="white" />
                    <Text style={styles.quickContactText}>
                      {isRTL ? 'اتصال هاتفي' : 'Call'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Detailed Information Grid */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>
                    {isRTL ? '📋 البيانات المسجلة بالاستمارة' : '📋 Submitted Credentials'}
                  </Text>

                  {/* Phone */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}>
                      <Phone size={16} color={Colors.primary} />
                    </View>
                    <View style={styles.detailTextBox}>
                      <Text style={styles.detailLabel}>{isRTL ? 'رقم الهاتف / الواتساب' : 'Phone'}</Text>
                      <Text style={styles.detailVal}>{selectedApp.phone}</Text>
                    </View>
                  </View>

                  {/* Email */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}>
                      <Mail size={16} color={Colors.primary} />
                    </View>
                    <View style={styles.detailTextBox}>
                      <Text style={styles.detailLabel}>{isRTL ? 'البريد الإلكتروني المسجل' : 'Email'}</Text>
                      <Text style={styles.detailVal}>{selectedApp.email}</Text>
                    </View>
                  </View>

                  {/* Syndicate ID */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}>
                      <Award size={16} color={Colors.primary} />
                    </View>
                    <View style={styles.detailTextBox}>
                      <Text style={styles.detailLabel}>{isRTL ? 'رقم القيد بنقابة أطباء الأسنان' : 'Syndicate ID'}</Text>
                      <Text style={styles.detailVal}>
                        {selectedApp.syndicateId || (isRTL ? 'لم يُدرج' : 'Not provided')}
                      </Text>
                    </View>
                  </View>

                  {/* Address */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}>
                      <MapPin size={16} color={Colors.primary} />
                    </View>
                    <View style={styles.detailTextBox}>
                      <Text style={styles.detailLabel}>{isRTL ? 'عنوان العيادة والمحافظة' : 'Clinic Address'}</Text>
                      <Text style={styles.detailVal}>
                        {selectedApp.clinicAddress} {selectedApp.governorate ? `(${selectedApp.governorate})` : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Consultation Fee */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}>
                      <DollarSign size={16} color={Colors.primary} />
                    </View>
                    <View style={styles.detailTextBox}>
                      <Text style={styles.detailLabel}>{isRTL ? 'سعر الكشف المحدد' : 'Consultation Fee'}</Text>
                      <Text style={styles.detailVal}>
                        {selectedApp.consultationFee ? `${selectedApp.consultationFee} ج.م` : (isRTL ? 'غير محدد' : 'Free / Not set')}
                      </Text>
                    </View>
                  </View>

                  {/* Submission Date */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconBox}>
                      <Calendar size={16} color={Colors.primary} />
                    </View>
                    <View style={styles.detailTextBox}>
                      <Text style={styles.detailLabel}>{isRTL ? 'تاريخ تقديم الطلب' : 'Submission Date'}</Text>
                      <Text style={styles.detailVal}>
                        {new Date(selectedApp.createdAt).toLocaleString('ar-EG')}
                      </Text>
                    </View>
                  </View>

                  {/* Rejection reason if applicable */}
                  {selectedApp.status === 'rejected' && selectedApp.rejectionReason && (
                    <View style={[styles.detailRow, { backgroundColor: '#fee2e2', borderRadius: 12, padding: 10 }]}>
                      <View style={styles.detailIconBox}>
                        <AlertCircle size={16} color="#dc2626" />
                      </View>
                      <View style={styles.detailTextBox}>
                        <Text style={[styles.detailLabel, { color: '#dc2626' }]}>
                          {isRTL ? 'سبب الرفض المسجل' : 'Rejection Reason'}
                        </Text>
                        <Text style={[styles.detailVal, { color: '#991b1b' }]}>
                          {selectedApp.rejectionReason}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Review Actions */}
                <View style={styles.modalActionButtons}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleApprove(selectedApp)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <UserCheck size={20} color="white" />
                        <Text style={styles.actionBtnText}>
                          {isRTL ? 'اعتماد ونشر الطبيب' : 'Approve Doctor'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={handleOpenRejectModal}
                    disabled={isProcessing}
                  >
                    <UserX size={20} color="#dc2626" />
                    <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>
                      {isRTL ? 'رفض الطلب' : 'Reject Application'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          )}
        </Modal>

        {/* Reject Reason Dialog */}
        <Modal
          visible={rejectReasonModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setRejectReasonModal(false)}
        >
          <View style={styles.rejectBackdrop}>
            <View style={styles.rejectBox}>
              <Text style={styles.rejectTitle}>
                {isRTL ? 'سبب رفض طلب الانضمام' : 'Reason for Rejection'}
              </Text>
              <Text style={styles.rejectSub}>
                {isRTL
                  ? 'يرجى كتابة سبب الرفض لتوضيحه للطبيب (مثال: بيانات الترخيص غير واضحة):'
                  : 'Please specify the rejection reason:'}
              </Text>

              <TextInput
                style={styles.rejectInput}
                placeholder={isRTL ? 'اكتب سبب الرفض هنا...' : 'Reason for rejection...'}
                value={rejectReasonText}
                onChangeText={setRejectReasonText}
                multiline
                numberOfLines={3}
                textAlign={isRTL ? 'right' : 'left'}
              />

              <View style={styles.rejectActions}>
                <TouchableOpacity
                  style={styles.cancelRejectBtn}
                  onPress={() => setRejectReasonModal(false)}
                >
                  <Text style={styles.cancelRejectText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmRejectBtn}
                  onPress={handleConfirmReject}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.confirmRejectText}>
                      {isRTL ? 'تأكيد الرفض' : 'Confirm Reject'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
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
  header: {
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    fontWeight: '800',
    color: Colors.primary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 14,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  doctorSpecialty: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  doctorAddress: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  cardInspectAction: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cardInspectText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  doctorProfileHero: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 10,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  quickContactRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickContactBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    ...Shadows.sm,
  },
  quickContactText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  detailsSection: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    ...Shadows.sm,
  },
  detailsSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  detailIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0fdfa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTextBox: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalActionButtons: {
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  approveBtn: {
    backgroundColor: '#16a34a',
    ...Shadows.md,
  },
  rejectBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: 'white',
  },
  rejectBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  rejectBox: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    ...Shadows.lg,
  },
  rejectTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  rejectSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
    textAlign: 'center',
  },
  rejectInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rejectActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelRejectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelRejectText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  confirmRejectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    alignItems: 'center',
  },
  confirmRejectText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
  },
});
