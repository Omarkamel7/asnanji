import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { successTap } from '../utils/haptics';
import {
  ShieldAlert,
  Clock,
  CheckCircle,
  FileCheck,
  Send,
  MessageCircle,
  Pill,
  Calendar,
  AlertTriangle,
} from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { FDI_TEETH, SYMPTOMS_LIST, DEFAULT_SERVICES } from '../constants/dentalData';
import DentalChart from '../components/DentalChart';
import { AudioRecorder } from '../components/AudioRecorder';
import { UrgencyLevel } from '../types';

interface DoctorConsultationDetailScreenProps {
  route: any;
  navigation: any;
}

export const DoctorConsultationDetailScreen: React.FC<
  DoctorConsultationDetailScreenProps
> = ({ route, navigation }) => {
  const { complaintId } = route.params;
  const {
    t,
    language,
    complaints,
    submitDiagnosis,
  } = useApp();

  const complaint = complaints.find((c) => c.id === complaintId);

  const [provisionalCondition, setProvisionalCondition] = useState(
    complaint?.diagnosis?.provisionalConditionAr || ''
  );
  const [firstAidInstructions, setFirstAidInstructions] = useState(
    complaint?.diagnosis?.firstAidInstructionsAr ||
      'تجنب الأطعمة شديدة البرودة أو السخونة، وتناول المسكن بعد الأكل لتخفيف الألم مؤقتاً لحين الكشف بالعيادة.'
  );
  const [medications, setMedications] = useState(
    complaint?.diagnosis?.recommendedMedicationsAr ||
      'مسكن بروفين 400 ملجم بعد الوجبات عند اللزوم (يرجى التأكد من عدم وجود حساسية أو مشاكل معدة)'
  );
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>(
    complaint?.urgencyLevel || 'urgent'
  );
  const [suggestedServiceId, setSuggestedServiceId] = useState<string>(
    complaint?.diagnosis?.suggestedServiceId || 'root_canal'
  );
  const [requireVisit, setRequireVisit] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!complaint) {
    return (
      <View style={styles.notFound}>
        <Text>الحالة غير موجودة</Text>
      </View>
    );
  }

  const handleSendDiagnosis = async () => {
    if (!provisionalCondition.trim()) {
      alert(
        language === 'ar'
          ? 'يرجى كتابة التشخيص المبدئي للحالة'
          : 'Please enter provisional condition diagnosis'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await submitDiagnosis(complaint.id, {
        diagnosedAt: new Date().toISOString(),
        doctorName: 'د. كريم أبو بكر',
        provisionalConditionAr: provisionalCondition,
        provisionalConditionEn: provisionalCondition,
        urgencyLevel,
        firstAidInstructionsAr: firstAidInstructions,
        firstAidInstructionsEn: firstAidInstructions,
        recommendedMedicationsAr: medications,
        recommendedMedicationsEn: medications,
        suggestedServiceId,
        requireClinicVisit: requireVisit,
      });

      successTap();

      Alert.alert(
        language === 'ar' ? 'تم إصدار التشخيص' : 'Diagnosis Submitted',
        language === 'ar'
          ? 'تم إرسال تقرير التشخيص المبدئي والإرشادات للمريض بنجاح.'
          : 'Preliminary diagnosis report sent to patient.',
        [
          {
            text: language === 'ar' ? 'حسناً' : 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (e) {
      console.warn('submit error', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Patient Profile Card */}
      <View style={styles.patientCard}>
        <View style={styles.patientHeader}>
          <View>
            <Text style={styles.patientName}>{complaint.patientName}</Text>
            <Text style={styles.patientPhone}>{complaint.patientPhone}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionBtnIcon}
              onPress={() => Linking.openURL(`tel:${complaint.patientPhone}`)}
            >
              <Text style={styles.iconText}>📞</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtnIcon}
              onPress={() => Linking.openURL(`whatsapp://send?phone=${complaint.patientPhone}`)}
            >
              <Text style={styles.iconText}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chatActionBtn}
              onPress={() =>
                navigation.navigate('Chat', {
                  consultationId: complaint.id,
                })
              }
            >
              <MessageCircle size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Medical History Alerts */}
        {complaint.medicalAlerts.length > 0 && (
          <View style={styles.alertsBar}>
            <ShieldAlert size={16} color={Colors.emergency} />
            <Text style={styles.alertsText}>
              تنبيهات صحية: {complaint.medicalAlerts.join(', ')}
            </Text>
          </View>
        )}
      </View>

      {/* 1. Affected Teeth on Dental Chart */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>الأسنان المحددة بواسطة المريض:</Text>
        <DentalChart
          selectedTeeth={complaint.selectedTeeth}
          onToggleTooth={() => {}}
          readOnly={true}
        />
      </View>

      {/* 2. Patient Complaint Symptoms & Pain */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>الأعراض ومستوى الألم:</Text>

        <View style={styles.painRow}>
          <Text style={styles.painLabel}>مستوى الألم المبلغ عنه:</Text>
          <View
            style={[
              styles.painBadge,
              {
                backgroundColor:
                  complaint.painLevel >= 7
                    ? Colors.emergencyBg
                    : Colors.urgentBg,
              },
            ]}
          >
            <Text
              style={[
                styles.painBadgeText,
                {
                  color:
                    complaint.painLevel >= 7
                      ? Colors.emergency
                      : Colors.urgent,
                },
              ]}
            >
              {complaint.painLevel} / 10
            </Text>
          </View>
        </View>

        {/* Symptoms Tags */}
        <View style={styles.symptomsList}>
          {complaint.symptoms.map((sId) => {
            const sym = SYMPTOMS_LIST.find((s) => s.id === sId);
            return (
              <View key={sId} style={styles.symptomTag}>
                <Text style={styles.symptomTagText}>
                  • {language === 'ar' ? sym?.labelAr : sym?.labelEn}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Description */}
        <Text style={styles.descTitle}>وصف المريض:</Text>
        <View style={styles.descBox}>
          <Text style={styles.descContent}>{complaint.description}</Text>
        </View>

        {/* Voice Note */}
        {complaint.audioNoteUri && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.descTitle}>تسجيل صوتي للمريض:</Text>
            <AudioRecorder
              audioUri={complaint.audioNoteUri}
              onAudioRecorded={() => {}}
            />
          </View>
        )}

        {/* Photos & X-Rays */}
        {complaint.photoUris.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.descTitle}>صور السن المرفقة:</Text>
            <ScrollView horizontal style={styles.imagesScroll}>
              {complaint.photoUris.map((uri) => (
                <Image
                  key={uri}
                  source={{ uri }}
                  style={styles.casePhoto}
                  cachePolicy="memory-disk"
                  placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c' }}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* 3. Doctor's Triage & Diagnosis Form */}
      <View style={styles.diagnosisFormCard}>
        <View style={styles.formHeader}>
          <FileCheck size={20} color={Colors.primary} />
          <Text style={styles.formTitle}>{t.writeDiagnosis}</Text>
        </View>

        {/* Provisional Diagnosis Field */}
        <Text style={styles.inputLabel}>
          {t.expectedDiagnosisField} (Provisional Diagnosis):
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="مثال: التهاب عصب حاد في الضرس 16، تسوس عميق، خراج لثوي..."
          value={provisionalCondition}
          onChangeText={setProvisionalCondition}
          textAlign={language === 'ar' ? 'right' : 'left'}
        />

        {/* Urgency Level Selector */}
        <Text style={styles.inputLabel}>{t.urgencyField}:</Text>
        <View style={styles.urgencyRow}>
          {[
            { key: 'emergency', label: 'طوارئ قصوى', bg: Colors.emergency },
            { key: 'urgent', label: 'عاجلة', bg: Colors.urgent },
            { key: 'moderate', label: 'متوسطة', bg: Colors.moderate },
            { key: 'routine', label: 'روتينية', bg: Colors.routine },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setUrgencyLevel(item.key as UrgencyLevel)}
              style={[
                styles.urgencyBtn,
                urgencyLevel === item.key && {
                  backgroundColor: item.bg,
                  borderColor: item.bg,
                },
              ]}
            >
              <Text
                style={[
                  styles.urgencyBtnText,
                  urgencyLevel === item.key && { color: Colors.white, fontWeight: '800' },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* First Aid Instructions */}
        <Text style={styles.inputLabel}>{t.instructionsField}:</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={3}
          value={firstAidInstructions}
          onChangeText={setFirstAidInstructions}
          textAlign={language === 'ar' ? 'right' : 'left'}
        />

        {/* Recommended Medications */}
        <Text style={styles.inputLabel}>الأدوية والمسكنات المقترحة (تسكين مؤقت):</Text>
        <TextInput
          style={styles.textInput}
          value={medications}
          onChangeText={setMedications}
          textAlign={language === 'ar' ? 'right' : 'left'}
        />

        {/* Suggested Service */}
        <Text style={styles.inputLabel}>الخدمة المقترحة للكشف في العيادة:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {DEFAULT_SERVICES.map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => setSuggestedServiceId(s.id)}
              style={[
                styles.serviceSelectChip,
                suggestedServiceId === s.id && styles.serviceSelectChipActive,
              ]}
            >
              <Text
                style={[
                  styles.serviceSelectText,
                  suggestedServiceId === s.id && styles.serviceSelectTextActive,
                ]}
              >
                {s.nameAr}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Submit Diagnosis Button */}
        <TouchableOpacity
          style={styles.sendDiagnosisBtn}
          onPress={handleSendDiagnosis}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Send size={18} color={Colors.white} />
              <Text style={styles.sendDiagnosisBtnText}>
                {t.sendDiagnosisToPatient}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

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
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    ...Shadows.sm,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  patientPhone: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    writingDirection: 'ltr',
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    backgroundColor: Colors.primary,
    borderRadius: 18,
    ...Shadows.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  iconText: {
    fontSize: 16,
  },
  alertsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.emergencyBg,
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  alertsText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.emergency,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  painRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  painLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  painBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  painBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  symptomsList: {
    gap: 4,
    marginBottom: 8,
  },
  symptomTag: {
    paddingVertical: 2,
  },
  symptomTagText: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  descTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: 4,
  },
  descBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  descContent: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 16,
  },
  imagesScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  casePhoto: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  diagnosisFormCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: 16,
    ...Shadows.md,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 8,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
    marginTop: 6,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: Colors.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  urgencyBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  urgencyBtnText: {
    fontSize: 10,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  serviceSelectChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 6,
  },
  serviceSelectChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  serviceSelectText: {
    fontSize: 11,
    color: Colors.textPrimary,
  },
  serviceSelectTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  sendDiagnosisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginTop: 8,
    ...Shadows.sm,
  },
  sendDiagnosisBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
  },
});
