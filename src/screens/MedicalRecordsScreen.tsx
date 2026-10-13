import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageCircle,
  Calendar,
  ChevronRight,
  Shield,
  Pill,
  Sparkles,
  Stethoscope,
  Activity,
  Printer,
  Share2,
} from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { FDI_TEETH } from '../constants/dentalData';

interface MedicalRecordsScreenProps {
  navigation: any;
}

export const MedicalRecordsScreen: React.FC<MedicalRecordsScreenProps> = ({
  navigation,
}) => {
  const {
    t,
    language,
    currentUser,
    complaints,
    isRTL,
    refreshClinicData,
    prescriptions,
    patientDentalRecords,
    updateUserProfile,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [activeEdrTab, setActiveEdrTab] = useState<'profile' | 'prescriptions' | 'scans' | 'consultations'>('profile');

  useFocusEffect(
    useCallback(() => {
      refreshClinicData().catch((e) => console.warn('MedicalRecords focus refresh error:', e));
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshClinicData();
    } catch (e) {
      console.warn('MedicalRecords onRefresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const myComplaints = complaints.filter(
    (c) => c.patientId === currentUser.id
  );

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
      case 'urgent':
        return {
          bg: Colors.emergencyBg,
          text: Colors.emergency,
          label: t.urgencyUrgent,
        };
      case 'moderate':
        return {
          bg: Colors.urgentBg,
          text: Colors.urgent,
          label: t.urgencyModerate,
        };
      default:
        return {
          bg: Colors.routineBg,
          text: Colors.routine,
          label: t.urgencyRoutine,
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'diagnosed':
        return {
          bg: Colors.primaryLight,
          text: Colors.primaryDark,
          label: t.statusDiagnosed,
        };
      case 'appointment_booked':
        return {
          bg: Colors.routineBg,
          text: Colors.routine,
          label: t.statusBooked,
        };
      default:
        return {
          bg: Colors.moderateBg,
          text: Colors.moderate,
          label: t.statusPending,
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
      {/* Patient Profile Quick Summary */}
      <View style={styles.profileBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(currentUser.fullName || 'م').charAt(0)}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.patientName}>
            {currentUser.fullName || (language === 'ar' ? 'مريض جديد' : 'New Patient')}
          </Text>
          <Text style={styles.patientPhone}>
            {currentUser.phone || (language === 'ar' ? 'حساب مسجل' : 'Registered Account')}
          </Text>
          <View style={styles.fileNoBadge}>
            <Text style={styles.fileNoText}>
              {language === 'ar' ? 'رقم الملف الطبي:' : 'Medical File #'} PT-
              {currentUser.id ? currentUser.id.slice(-4) : '0001'}
            </Text>
          </View>
        </View>
      </View>

      {/* 4 EDR Navigation Tabs */}
      <View style={styles.edrTabsRow}>
        <TouchableOpacity
          style={[styles.edrTab, activeEdrTab === 'profile' && styles.edrTabActive]}
          onPress={() => setActiveEdrTab('profile')}
        >
          <Activity size={16} color={activeEdrTab === 'profile' ? Colors.white : Colors.textPrimary} />
          <Text style={[styles.edrTabText, activeEdrTab === 'profile' && styles.edrTabTextActive]}>
            {language === 'ar' ? 'الملف الصحي' : 'Health Profile'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.edrTab, activeEdrTab === 'prescriptions' && styles.edrTabActive]}
          onPress={() => setActiveEdrTab('prescriptions')}
        >
          <Pill size={16} color={activeEdrTab === 'prescriptions' ? Colors.white : Colors.textPrimary} />
          <Text style={[styles.edrTabText, activeEdrTab === 'prescriptions' && styles.edrTabTextActive]}>
            {language === 'ar' ? 'الروشتات' : 'Prescriptions'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.edrTab, activeEdrTab === 'scans' && styles.edrTabActive]}
          onPress={() => setActiveEdrTab('scans')}
        >
          <Sparkles size={16} color={activeEdrTab === 'scans' ? Colors.white : Colors.textPrimary} />
          <Text style={[styles.edrTabText, activeEdrTab === 'scans' && styles.edrTabTextActive]}>
            {language === 'ar' ? 'الأشعات والفحوصات' : 'X-Rays & Scans'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.edrTab, activeEdrTab === 'consultations' && styles.edrTabActive]}
          onPress={() => setActiveEdrTab('consultations')}
        >
          <FileText size={16} color={activeEdrTab === 'consultations' ? Colors.white : Colors.textPrimary} />
          <Text style={[styles.edrTabText, activeEdrTab === 'consultations' && styles.edrTabTextActive]}>
            {language === 'ar' ? 'الاستشارات' : 'Consultations'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab 1: Health Profile & Allergies Card */}
      {activeEdrTab === 'profile' && (
        <View style={styles.edrCard}>
          <View style={styles.edrCardHeader}>
            <Shield size={20} color={Colors.primary} />
            <Text style={styles.edrCardTitle}>
              {language === 'ar' ? 'التاريخ الصحي وتنبيهات الحساسية 🩺' : 'Health History & Medical Alerts'}
            </Text>
          </View>
          <Text style={styles.edrCardSubtitle}>
            {language === 'ar'
              ? 'تظهر هذه التنبيهات تلقائياً لأي طبيب تفحصه لضمان أمان الإجراءات الطبية'
              : 'Medical alerts shared with treating dentists for procedure safety'}
          </Text>

          <View style={styles.healthGrid}>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>{language === 'ar' ? 'مرض السكري:' : 'Diabetes:'}</Text>
              <Text style={[styles.healthValue, currentUser.medicalHistory?.hasDiabetes && { color: '#E11D48' }]}>
                {currentUser.medicalHistory?.hasDiabetes ? (language === 'ar' ? 'نعم ⚠️' : 'Yes ⚠️') : (language === 'ar' ? 'لا' : 'No')}
              </Text>
            </View>

            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>{language === 'ar' ? 'ضغط الدم:' : 'Hypertension:'}</Text>
              <Text style={[styles.healthValue, currentUser.medicalHistory?.hasHypertension && { color: '#E11D48' }]}>
                {currentUser.medicalHistory?.hasHypertension ? (language === 'ar' ? 'نعم ⚠️' : 'Yes ⚠️') : (language === 'ar' ? 'لا' : 'No')}
              </Text>
            </View>

            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>{language === 'ar' ? 'حساسية البنسلين:' : 'Penicillin Allergy:'}</Text>
              <Text style={[styles.healthValue, currentUser.medicalHistory?.hasPenicillinAllergy && { color: '#E11D48' }]}>
                {currentUser.medicalHistory?.hasPenicillinAllergy ? (language === 'ar' ? 'نعم ⚠️' : 'Yes ⚠️') : (language === 'ar' ? 'لا' : 'No')}
              </Text>
            </View>

            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>{language === 'ar' ? 'سيولة الدم:' : 'Bleeding Disorder:'}</Text>
              <Text style={[styles.healthValue, currentUser.medicalHistory?.hasBleedingDisorder && { color: '#E11D48' }]}>
                {currentUser.medicalHistory?.hasBleedingDisorder ? (language === 'ar' ? 'نعم ⚠️' : 'Yes ⚠️') : (language === 'ar' ? 'لا' : 'No')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Tab 2: Prescriptions Archive */}
      {activeEdrTab === 'prescriptions' && (
        <View style={styles.edrCard}>
          <View style={styles.edrCardHeader}>
            <Pill size={20} color="#16A34A" />
            <Text style={styles.edrCardTitle}>
              {language === 'ar' ? 'أرشيف الروشتات الطبية الرقمية 📄' : 'Digital Prescriptions Archive'}
            </Text>
          </View>
          {prescriptions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Pill size={36} color={Colors.textMuted} />
              <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 8 }}>
                {language === 'ar' ? 'لا توجد روشتات صادرة حتى الآن' : 'No prescriptions issued yet'}
              </Text>
            </View>
          ) : (
            prescriptions.map((rx) => (
              <View key={rx.id} style={styles.rxCardItem}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.textPrimary }}>{rx.diagnosisTitle}</Text>
                  <Text style={{ fontSize: 11, color: Colors.textMuted }}>{new Date(rx.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 8 }}>
                  {language === 'ar' ? 'الطبيب المعالج:' : 'Doctor:'} {rx.doctorName || 'طبيب العيادة'}
                </Text>
                {rx.medications.map((med, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', gap: 6, marginVertical: 2 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primaryDark }}>• {med.name}</Text>
                    <Text style={{ fontSize: 12, color: Colors.textSecondary }}>({med.dose} - {med.frequency})</Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
      )}

      {/* Tab 3: Diagnostic X-Rays & Scans Gallery */}
      {activeEdrTab === 'scans' && (
        <View style={styles.edrCard}>
          <View style={styles.edrCardHeader}>
            <Sparkles size={20} color="#7E22CE" />
            <Text style={styles.edrCardTitle}>
              {language === 'ar' ? 'معرض الأشعات وفحوصات الأسنان 🩻' : 'X-Rays & Dental Scans Gallery'}
            </Text>
          </View>
          {patientDentalRecords.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <FileText size={36} color={Colors.textMuted} />
              <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 8 }}>
                {language === 'ar' ? 'لا توجد أشعات مرفوعة في ملفك' : 'No X-rays uploaded in your record'}
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {patientDentalRecords.map((rec) => (
                <View key={rec.id} style={{ width: '48%', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border }}>
                  <Image source={{ uri: rec.imageUrl }} style={{ width: '100%', height: 120 }} />
                  <View style={{ padding: 6, backgroundColor: Colors.surface }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textPrimary }} numberOfLines={1}>{rec.title}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Tab 4: Consultations List */}
      {activeEdrTab === 'consultations' && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.previousConsultations}</Text>
          </View>

      {myComplaints.length === 0 ? (
        <View style={styles.emptyCard}>
          <FileText size={40} color={Colors.textMuted} style={{ marginBottom: 8 }} />
          <Text style={styles.emptyText}>
            {language === 'ar' ? 'لم تقم بإرسال أي طلب استشارة بعد' : 'You have not submitted any consultation requests yet'}
          </Text>
          <TouchableOpacity
            style={styles.newConsultBtn}
            onPress={() => navigation.navigate('ComplaintIntake')}
          >
            <Text style={styles.newConsultBtnText}>
              {language === 'ar' ? 'طلب استشارة جديدة' : 'Request New Consultation'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        myComplaints.map((item) => {
          const urgency = getUrgencyBadge(item.urgencyLevel);
          const status = getStatusBadge(item.status);

          return (
            <View key={item.id} style={styles.complaintCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View
                    style={[
                      styles.badgePill,
                      { backgroundColor: urgency.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: urgency.text },
                      ]}
                    >
                      {urgency.label}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badgePill,
                      { backgroundColor: status.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: status.text },
                      ]}
                    >
                      {status.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.dateText}>
                  {new Date(item.createdAt).toLocaleDateString(
                    language === 'ar' ? 'ar-EG' : 'en-US'
                  )}
                </Text>
              </View>

              {/* Teeth & Symptoms Tags */}
              <View style={styles.teethRow}>
                {item.selectedTeeth.map((num) => {
                  const tooth = FDI_TEETH.find((t) => t.fdiNumber === num);
                  return (
                    <View key={num} style={styles.toothTag}>
                      <Text style={styles.toothTagNum}>#{num}</Text>
                      <Text style={styles.toothTagName}>
                        {language === 'ar' ? tooth?.nameAr : tooth?.nameEn}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Patient Complaint Text */}
              <Text style={styles.complaintDesc}>{item.description}</Text>

              {/* Doctor's Preliminary Diagnosis (If issued) */}
              {item.diagnosis ? (
                <View style={styles.diagnosisBox}>
                  <View style={styles.diagHeader}>
                    <Image
                      source={require('../../assets/doctor_clinic.jpg')}
                      style={styles.diagDoctorAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.diagDoctorName}>
                        {item.diagnosis.doctorName || (language === 'ar' ? 'طبيب العيادة المعالج' : 'Treating Dentist')}
                      </Text>
                      <Text style={styles.diagTitle}>
                        {t.doctorDiagnosisTitle}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.diagCondition}>
                    {language === 'ar'
                      ? item.diagnosis.provisionalConditionAr
                      : item.diagnosis.provisionalConditionEn}
                  </Text>

                  <View style={styles.instructionsBox}>
                    <Text style={styles.instructionsTitle}>
                      {t.firstAidInstructions}
                    </Text>
                    <Text style={styles.instructionsText}>
                      {language === 'ar'
                        ? item.diagnosis.firstAidInstructionsAr
                        : item.diagnosis.firstAidInstructionsEn}
                    </Text>
                  </View>

                  {item.diagnosis.recommendedMedicationsAr && (
                    <View style={styles.medicationRow}>
                      <Pill size={14} color={Colors.secondary} />
                      <Text style={styles.medicationText}>
                        {language === 'ar'
                          ? item.diagnosis.recommendedMedicationsAr
                          : item.diagnosis.recommendedMedicationsEn}
                      </Text>
                    </View>
                  )}

                  {/* Actions for this Diagnosis */}
                  <View style={styles.diagActionsRow}>
                    <TouchableOpacity
                      style={styles.chatDoctorBtn}
                      onPress={() =>
                        navigation.navigate('Chat', {
                          consultationId: item.id,
                        })
                      }
                    >
                      <MessageCircle size={16} color={Colors.primary} />
                      <Text style={styles.chatDoctorBtnText}>
                        {t.chatWithDoctor}
                      </Text>
                    </TouchableOpacity>

                    {item.diagnosis.requireClinicVisit && (
                      <TouchableOpacity
                        style={styles.bookVisitBtn}
                        onPress={() =>
                          navigation.navigate('Appointments', {
                            selectedServiceId:
                              item.diagnosis?.suggestedServiceId,
                          })
                        }
                      >
                        <Calendar size={16} color={Colors.white} />
                        <Text style={styles.bookVisitBtnText}>
                          {t.bookRecommendedVisit}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.pendingReviewBox}>
                  <View style={styles.pendingReviewContent}>
                    <Clock size={16} color={Colors.urgent} />
                    <Text style={styles.pendingReviewText}>
                      {language === 'ar'
                        ? 'الشكوى قيد الفحص الطبي من قبل طبيب العيادة، سيتم إرسال التشخيص المبدئي والتعليمات قريباً.'
                        : 'Under review by the treating clinic dentist. You will receive initial triage instructions shortly.'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.chatPendingBtn}
                    onPress={() =>
                      navigation.navigate('Chat', {
                        consultationId: item.id,
                      })
                    }
                  >
                    <MessageCircle size={15} color={Colors.primaryDark} />
                    <Text style={styles.chatPendingBtnText}>
                      {t.chatWithDoctor}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })
      )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    gap: 12,
    ...Shadows.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  patientPhone: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    writingDirection: 'ltr',
  },
  fileNoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  fileNoText: {
    fontSize: 10,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  newConsultBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  newConsultBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  complaintCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 6,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  teethRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  toothTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  toothTagNum: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  toothTagName: {
    fontSize: 10,
    color: Colors.textPrimary,
  },
  complaintDesc: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
    marginBottom: 12,
  },
  diagnosisBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    padding: 12,
    gap: 8,
  },
  diagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
    paddingBottom: 8,
  },
  diagDoctorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
  },
  diagDoctorName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  diagTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondary,
  },
  diagCondition: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  instructionsBox: {
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  instructionsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 2,
  },
  instructionsText: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 16,
  },
  medicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  medicationText: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: '600',
  },
  diagActionsRow: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 4,
  },
  chatDoctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    gap: 6,
  },
  chatDoctorBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  bookVisitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  bookVisitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
  },
  pendingReviewBox: {
    backgroundColor: Colors.moderateBg,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  pendingReviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingReviewText: {
    fontSize: 11,
    color: '#854d0e',
    flex: 1,
    lineHeight: 16,
  },
  chatPendingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 6,
    gap: 6,
  },
  chatPendingBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  edrTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  edrTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  edrTabActive: {
    backgroundColor: Colors.primary,
    ...Shadows.sm,
  },
  edrTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  edrTabTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  edrCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  edrCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  edrCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  edrCardSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 14,
  },
  healthGrid: {
    gap: 8,
  },
  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  healthLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  healthValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
  },
  rxCardItem: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
