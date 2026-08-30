import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import {
  Camera,
  Image as ImageIcon,
  Check,
  AlertCircle,
  ShieldAlert,
  Zap,
  Sparkles,
  Info,
  Trash2,
} from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { lightTap, successTap } from '../utils/haptics';
import { useApp } from '../context/AppContext';
import { SYMPTOMS_LIST } from '../constants/dentalData';
import DentalChart from '../components/DentalChart';
import { AudioRecorder } from '../components/AudioRecorder';
import { UrgencyLevel } from '../types';
import { uploadDentalPhoto, uploadDentalAudio } from '../services/supabaseStorage';

interface ComplaintIntakeScreenProps {
  navigation: any;
}

export const ComplaintIntakeScreen: React.FC<ComplaintIntakeScreenProps> = ({ navigation }) => {
  const { t, language, isRTL, currentUser, savePatientQuickProfile, addComplaint, createConsultationWithChat } = useApp();

  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [painLevel, setPainLevel] = useState<number>(5);
  const [description, setDescription] = useState('');
  const [patientName, setPatientName] = useState(currentUser.fullName || '');
  const [patientPhone, setPatientPhone] = useState(currentUser.phone || '');
  const [audioUri, setAudioUri] = useState<string | undefined>(undefined);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [xrayUris, setXrayUris] = useState<string[]>([]);
  const [medicalAlerts, setMedicalAlerts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const toggleTooth = (fdiNumber: number) => {
    if (selectedTeeth.includes(fdiNumber)) {
      lightTap(); setSelectedTeeth(selectedTeeth.filter((n) => n !== fdiNumber));
    } else {
      lightTap(); setSelectedTeeth([...selectedTeeth, fdiNumber]);
    }
  };

  const toggleSymptom = (id: string) => {
    if (selectedSymptoms.includes(id)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, id]);
    }
  };

  const toggleMedicalAlert = (alertKey: string) => {
    if (medicalAlerts.includes(alertKey)) {
      setMedicalAlerts(medicalAlerts.filter((a) => a !== alertKey));
    } else {
      setMedicalAlerts([...medicalAlerts, alertKey]);
    }
  };

  const pickImage = async (type: 'photo' | 'xray') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        if (type === 'photo') {
          setPhotoUris((prev) => [...prev, uri]);
        } else {
          setXrayUris((prev) => [...prev, uri]);
        }
      }
    } catch (e) {
      console.warn('Image picker error', e);
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        alert(language === 'ar' ? 'يرجى إعطاء صلاحية الكاميرا' : 'Camera permission required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setPhotoUris((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (e) {
      console.warn('Camera error', e);
    }
  };

  const calculateUrgency = (): UrgencyLevel => {
    if (
      painLevel >= 8 ||
      selectedSymptoms.includes('gum_swelling') ||
      selectedSymptoms.includes('broken_tooth')
    ) {
      return 'urgent';
    }
    if (painLevel >= 5 || selectedSymptoms.includes('night_pain')) {
      return 'moderate';
    }
    return 'routine';
  };

  const handleSubmit = async () => {
    if (selectedSymptoms.length === 0 && !description.trim()) {
      alert(
        language === 'ar'
          ? 'يرجى اختيار الأعراض أو كتابة وصف للشكوى'
          : 'Please select symptoms or enter a description'
      );
      return;
    }

    if (!patientName.trim() || !patientPhone.trim()) {
      alert(
        language === 'ar'
          ? 'يرجى إدخال اسمك ورقم الهاتف حتى يتمكن د. كريم من التعرف على حالتك والرد عليك'
          : 'Please enter your name and phone number'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Save quick patient profile
      await savePatientQuickProfile(patientName, patientPhone);

      // 2. Upload media to Supabase Storage if present
      const totalFiles = photoUris.length + xrayUris.length + (audioUri ? 1 : 0);
      let progresses = new Array(totalFiles).fill(0);
      const updateOverallProgress = () => {
        if (totalFiles === 0) {
          setUploadProgress(100);
          return;
        }
        const total = progresses.reduce((a, b) => a + b, 0);
        setUploadProgress(Math.round(total / totalFiles));
      };

      let fileIndex = 0;
      let audioPromise = Promise.resolve(undefined as string | undefined);
      if (audioUri) {
        const idx = fileIndex++;
        // audio doesn't necessarily have onProgress, but let's just mark it done when finished or try to pass onProgress if it exists
        // Wait, the instructions said uploadDentalPhoto supports onProgress.
        audioPromise = uploadDentalAudio(audioUri, currentUser.id).then(url => {
          progresses[idx] = 100;
          updateOverallProgress();
          return url;
        });
      }

      const photoPromises = photoUris.map(async (pUri) => {
        const url = await uploadDentalPhoto(pUri, currentUser.id);
        const idx = fileIndex++;
        progresses[idx] = 100;
        updateOverallProgress();
        return url;
      });

      const xrayPromises = xrayUris.map(async (xUri) => {
        const url = await uploadDentalPhoto(xUri, currentUser.id);
        const idx = fileIndex++;
        progresses[idx] = 100;
        updateOverallProgress();
        return url;
      });

      const [uploadedAudioUrl, uploadedPhotoUrls, uploadedXrayUrls] = await Promise.all([
        audioPromise,
        Promise.all(photoPromises),
        Promise.all(xrayPromises)
      ]);

      const { consultationId } = await createConsultationWithChat({
        patientId: currentUser.id || `pat_${Date.now()}`,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        selectedTeeth,
        symptoms: selectedSymptoms,
        painLevel,
        description,
        audioNoteUri: uploadedAudioUrl,
        photoUris: uploadedPhotoUrls,
        xrayUris: uploadedXrayUrls,
        medicalAlerts,
        urgencyLevel: calculateUrgency(),
      });

      setIsSubmitting(false);
      successTap();
      setUploadProgress(0);

      Alert.alert(
        language === 'ar' ? 'تم إرسال الشكوى بنجاح' : 'Submitted Successfully',
        language === 'ar'
          ? 'تم استلام شكواك وسيقوم د. كريم بالرد عليك ومتابعة حالتك مباشرة.'
          : 'Your case has been received by Dr. Karim.',
        [
          {
            text: language === 'ar' ? 'فتح المحادثة المباشرة 💬' : 'Open Live Chat 💬',
            onPress: () => navigation.navigate('Chat', { consultationId }),
          },
          {
            text: language === 'ar' ? 'متابعة الحالة بالسجل' : 'Track Case',
            onPress: () => navigation.navigate('MedicalRecords'),
            style: 'cancel',
          },
        ]
      );
    } catch (err) {
      setIsSubmitting(false);
      setUploadProgress(0);
      console.warn('Error submitting complaint', err);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Intro Banner */}
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>{t.complaintTitle}</Text>
        <Text style={styles.headerSub}>
          {language === 'ar'
            ? 'املأ تفاصيل الشكوى ليتمكن د. كريم من تشخيص الحالة بدقة وإعطائك الإرشادات الفورية.'
            : 'Provide your symptoms for Dr. Karim to evaluate and provide initial triage instructions.'}
        </Text>
      </View>

      {/* Step 1: Interactive Dental Chart */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>{t.step1Tooth}</Text>
          {selectedTeeth.length > 0 && (
            <TouchableOpacity onPress={() => { lightTap(); setSelectedTeeth([]); }}>
              <Text style={styles.clearText}>{t.clearSelection}</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.stepSubtitle}>{t.step1Sub}</Text>

        <DentalChart
          selectedTeeth={selectedTeeth}
          onToggleTooth={toggleTooth}
        />
      </View>

      {/* Step 2: Symptoms Selection */}
      <View style={styles.stepCard}>
        <Text style={styles.stepTitle}>{t.step2Symptoms}</Text>
        <Text style={styles.stepSubtitle}>{t.step2Sub}</Text>

        <View style={styles.symptomsGrid}>
          {SYMPTOMS_LIST.map((symptom) => {
            const isSelected = selectedSymptoms.includes(symptom.id);
            return (
              <TouchableOpacity
                key={symptom.id}
                onPress={() => toggleSymptom(symptom.id)}
                style={[
                  styles.symptomPill,
                  isSelected && styles.symptomPillSelected,
                ]}
              >
                <View
                  style={[
                    styles.checkboxCircle,
                    isSelected && styles.checkboxCircleSelected,
                  ]}
                >
                  {isSelected && <Check size={12} color={Colors.white} />}
                </View>
                <Text
                  style={[
                    styles.symptomText,
                    isSelected && styles.symptomTextSelected,
                  ]}
                >
                  {language === 'ar' ? symptom.labelAr : symptom.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Step 3: Pain Level Slider (1 - 10) */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>{t.step3PainLevel}</Text>
          <View
            style={[
              styles.painScoreBadge,
              {
                backgroundColor:
                  painLevel >= 7
                    ? Colors.emergencyBg
                    : painLevel >= 4
                    ? Colors.urgentBg
                    : Colors.routineBg,
              },
            ]}
          >
            <Text
              style={[
                styles.painScoreText,
                {
                  color:
                    painLevel >= 7
                      ? Colors.emergency
                      : painLevel >= 4
                      ? Colors.urgent
                      : Colors.routine,
                },
              ]}
            >
              {painLevel} / 10
            </Text>
          </View>
        </View>

        {/* 1-10 Buttons Selector */}
        <View style={styles.painButtonsRow}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            const isSelected = painLevel === num;
            const isSevere = num >= 7;
            const isModerate = num >= 4 && num < 7;
            return (
              <TouchableOpacity
                key={num}
                onPress={() => { lightTap(); setPainLevel(num); }}
                style={[
                  styles.painNumBtn,
                  isSelected && {
                    backgroundColor: isSevere
                      ? Colors.emergency
                      : isModerate
                      ? Colors.urgent
                      : Colors.primary,
                    borderColor: isSevere
                      ? Colors.emergency
                      : isModerate
                      ? Colors.urgent
                      : Colors.primaryDark,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.painNumText,
                    isSelected && { color: Colors.white, fontWeight: '800' },
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.painLabelsRow}>
          <Text style={styles.painLabel}>{t.painMild}</Text>
          <Text style={styles.painLabel}>{t.painModerate}</Text>
          <Text style={styles.painLabel}>{t.painSevere}</Text>
        </View>
      </View>

      {/* Step 4: Description & Details */}
      <View style={styles.stepCard}>
        <Text style={styles.stepTitle}>{t.step4Description}</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder={t.descriptionPlaceholder}
          placeholderTextColor={Colors.textMuted}
          value={description}
          onChangeText={setDescription}
          textAlign={language === 'ar' ? 'right' : 'left'}
        />
      </View>

      {/* Step 5: Media & Voice Note */}
      <View style={styles.stepCard}>
        <Text style={styles.stepTitle}>{t.step5Media}</Text>

        {/* Voice Note Recorder */}
        <AudioRecorder
          audioUri={audioUri}
          onAudioRecorded={(uri) => setAudioUri(uri)}
        />

        {/* Photo Upload Buttons */}
        <View style={styles.mediaButtonsRow}>
          <TouchableOpacity
            style={styles.mediaBtn}
            onPress={takePhoto}
          >
            <Camera size={18} color={Colors.primary} />
            <Text style={styles.mediaBtnText}>{t.takeToothPhoto}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaBtn}
            onPress={() => pickImage('xray')}
          >
            <ImageIcon size={18} color={Colors.secondary} />
            <Text style={styles.mediaBtnText}>{t.uploadXray}</Text>
          </TouchableOpacity>
        </View>

        {/* Uploaded Photos Preview Grid */}
        {(photoUris.length > 0 || xrayUris.length > 0) && (
          <View style={styles.previewGrid}>
            {photoUris.map((uri, idx) => (
              <View key={`p_${idx}`} style={styles.thumbWrapper}>
                <Image source={{ uri }} style={styles.thumbImage} />
                <TouchableOpacity
                  style={styles.removeThumb}
                  onPress={() =>
                    setPhotoUris(photoUris.filter((_, i) => i !== idx))
                  }
                >
                  <Trash2 size={12} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            {xrayUris.map((uri, idx) => (
              <View key={`x_${idx}`} style={styles.thumbWrapper}>
                <Image source={{ uri }} style={styles.thumbImage} />
                <View style={styles.xrayBadge}>
                  <Text style={styles.xrayBadgeText}>X-Ray</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeThumb}
                  onPress={() =>
                    setXrayUris(xrayUris.filter((_, i) => i !== idx))
                  }
                >
                  <Trash2 size={12} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Step 6: Medical History Alerts */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>{t.step6MedicalHistory}</Text>
          <ShieldAlert size={18} color={Colors.emergency} />
        </View>

        <View style={styles.medicalAlertsList}>
          {[
            { key: 'diabetes', label: t.diabetes },
            { key: 'hypertension', label: t.hypertension },
            { key: 'heartDisease', label: t.heartDisease },
            { key: 'bleedingDisorder', label: t.bleedingDisorder },
            { key: 'penicillinAllergy', label: t.penicillinAllergy },
            { key: 'pregnancy', label: t.pregnancy },
          ].map((item) => {
            const isChecked = medicalAlerts.includes(item.key);
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => toggleMedicalAlert(item.key)}
                style={[
                  styles.alertRow,
                  isChecked && styles.alertRowActive,
                ]}
              >
                <View
                  style={[
                    styles.alertCheckbox,
                    isChecked && styles.alertCheckboxActive,
                  ]}
                >
                  {isChecked && <Check size={12} color={Colors.white} />}
                </View>
                <Text
                  style={[
                    styles.alertLabel,
                    isChecked && styles.alertLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Step 7: Quick Patient Contact Info */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>
            {language === 'ar' ? '7. بيانات التواصل للرد عليك' : '7. Your Contact Information'}
          </Text>
        </View>
        <Text style={styles.stepSubtitle}>
          {language === 'ar'
            ? 'أدخل اسمك ورقم هاتفك حتى يتمكن د. كريم من مراجعة حالتك والرد عليك.'
            : 'Enter your name and phone number for Dr. Karim to contact and advise you.'}
        </Text>

        <TextInput
          style={styles.textInput}
          placeholder={language === 'ar' ? 'الاسم بالكامل (مثال: محمد أحمد)' : 'Your full name'}
          value={patientName}
          onChangeText={setPatientName}
          textAlign={isRTL ? 'right' : 'left'}
        />

        <TextInput
          style={[styles.textInput, { marginTop: 10, writingDirection: 'ltr' }]}
          placeholder={language === 'ar' ? 'رقم الهاتف / الواتساب (+20 100 000 0000)' : '+20 100 000 0000'}
          value={patientPhone}
          onChangeText={setPatientPhone}
          keyboardType="phone-pad"
          textAlign={isRTL ? 'right' : 'left'}
        />
      </View>

      {/* Submit Button */}
      {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
        <View style={{ marginBottom: 10, alignItems: 'center' }}>
          <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>{language === 'ar' ? `جاري الرفع... %${uploadProgress}` : `Uploading... ${uploadProgress}%`}</Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Zap size={20} color={Colors.white} />
        <Text style={styles.submitButtonText}>
          {isSubmitting ? t.submittingComplaint : (language === 'ar' ? 'إرسال الشكوى واستلام التشخيص المبدئي' : t.submitComplaint)}
        </Text>
      </TouchableOpacity>

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
  headerBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  stepCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    ...Shadows.sm,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  stepSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  clearText: {
    fontSize: 12,
    color: Colors.emergency,
    fontWeight: '700',
  },
  symptomsGrid: {
    gap: 8,
  },
  symptomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  symptomPillSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCircleSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  symptomText: {
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  symptomTextSelected: {
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  painScoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  painScoreText: {
    fontSize: 13,
    fontWeight: '800',
  },
  painButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  painNumBtn: {
    width: 30,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  painNumText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  painLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  painLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 90,
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  mediaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  mediaBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  thumbWrapper: {
    position: 'relative',
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  removeThumb: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    borderRadius: 10,
    padding: 4,
  },
  xrayBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  xrayBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  medicalAlertsList: {
    gap: 8,
    marginTop: 8,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  alertRowActive: {
    backgroundColor: Colors.emergencyBg,
    borderColor: Colors.emergency,
  },
  alertCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCheckboxActive: {
    backgroundColor: Colors.emergency,
    borderColor: Colors.emergency,
  },
  alertLabel: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  alertLabelActive: {
    color: Colors.emergency,
    fontWeight: '700',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    ...Shadows.md,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: Colors.textPrimary,
  },
});
