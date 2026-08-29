import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Camera,
  Image as ImageIcon,
  X,
  AlertTriangle,
  Send,
  User,
  Phone,
  Sparkles,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { uploadDentalPhoto } from '../services/supabaseStorage';
import { UrgencyLevel } from '../types';

const SYMPTOM_OPTIONS = [
  { id: 'sharp_pain', labelAr: 'ألم حاد ومفاجئ', labelEn: 'Sharp Sudden Pain', icon: '⚡' },
  { id: 'sensitivity', labelAr: 'حساسية مع البارد والساخن', labelEn: 'Hot/Cold Sensitivity', icon: '❄️' },
  { id: 'gum_bleeding', labelAr: 'نزيف أو التهاب اللثة', labelEn: 'Bleeding/Inflamed Gums', icon: '🩸' },
  { id: 'broken_tooth', labelAr: 'كسر بالسن أو الحشوة', labelEn: 'Broken Tooth/Filling', icon: '🦷' },
  { id: 'swelling', labelAr: 'انتفاخ وتورم باللثة/الوجه', labelEn: 'Gum/Facial Swelling', icon: '⚠️' },
  { id: 'chewing_pain', labelAr: 'ألم عند المضغ والضغط', labelEn: 'Pain While Chewing', icon: '🍔' },
  { id: 'cosmetics', labelAr: 'استفسار تجميل وتبييض', labelEn: 'Cosmetics / Whitening', icon: '✨' },
  { id: 'implants_ortho', labelAr: 'استفسار زراعة أو تقويم', labelEn: 'Implants / Orthodontics', icon: '💎' },
];

const SECTOR_OPTIONS = [
  { id: 'upper_right', labelAr: 'فك علوي (يمين)', labelEn: 'Upper Right', teeth: [18, 17, 16, 15, 14] },
  { id: 'upper_front', labelAr: 'فك علوي (أمامي)', labelEn: 'Upper Front', teeth: [13, 12, 11, 21, 22, 23] },
  { id: 'upper_left', labelAr: 'فك علوي (يسار)', labelEn: 'Upper Left', teeth: [24, 25, 26, 27, 28] },
  { id: 'lower_right', labelAr: 'فك سفلي (يمين)', labelEn: 'Lower Right', teeth: [48, 47, 46, 45, 44] },
  { id: 'lower_front', labelAr: 'فك سفلي (أمامي)', labelEn: 'Lower Front', teeth: [43, 42, 41, 31, 32, 33] },
  { id: 'lower_left', labelAr: 'فك سفلي (يسار)', labelEn: 'Lower Left', teeth: [34, 35, 36, 37, 38] },
  { id: 'all_mouth', labelAr: 'الفك بالكامل / عام', labelEn: 'Full Mouth / General', teeth: [] },
];

export const NewConsultationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { language, isRTL, currentUser, savePatientQuickProfile, createConsultationWithChat } = useApp();

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('all_mouth');
  const [painLevel, setPainLevel] = useState<number>(6);
  const [description, setDescription] = useState<string>('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [patientName, setPatientName] = useState<string>(currentUser.fullName || '');
  const [patientPhone, setPatientPhone] = useState<string>(currentUser.phone || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toggleSymptom = (symId: string) => {
    if (selectedSymptoms.includes(symId)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symId));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symId]);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          language === 'ar' ? 'تنبيه' : 'Notice',
          language === 'ar' ? 'يرجى السماح بالوصول للصور لرفع صور الأشعة والأسنان' : 'Please grant photos permission'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUris([...photoUris, result.assets[0].uri]);
      }
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          language === 'ar' ? 'تنبيه' : 'Notice',
          language === 'ar' ? 'يرجى السماح بالوصول للكاميرا لتصوير السن' : 'Please grant camera permission'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUris([...photoUris, result.assets[0].uri]);
      }
    } catch (e) {
      console.warn('Camera error:', e);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUris(photoUris.filter((_, idx) => idx !== index));
  };

  const calculateUrgency = (): UrgencyLevel => {
    if (painLevel >= 8 || selectedSymptoms.includes('swelling') || selectedSymptoms.includes('sharp_pain')) {
      return 'urgent';
    }
    if (painLevel >= 5 || selectedSymptoms.includes('broken_tooth') || selectedSymptoms.includes('gum_bleeding')) {
      return 'moderate';
    }
    return 'routine';
  };

  const handleSubmit = async () => {
    if (!patientName.trim() || !patientPhone.trim()) {
      Alert.alert(
        language === 'ar' ? 'بيانات المريض مطلوبة' : 'Name & Phone Required',
        language === 'ar'
          ? 'يرجى إدخال اسمك ورقم هاتفك حتى يتمكن د. كريم من التعرف على حالتك والرد عليك.'
          : 'Please enter your name and phone number so the doctor can contact and advise you.'
      );
      return;
    }

    if (!description.trim() && selectedSymptoms.length === 0) {
      Alert.alert(
        language === 'ar' ? 'تنبيه' : 'Notice',
        language === 'ar'
          ? 'يرجى اختيار عرض واحد على الأقل أو كتابة وصف مختصر للشكوى.'
          : 'Please select at least one symptom or describe your complaint.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Save quick patient profile
      await savePatientQuickProfile(patientName, patientPhone);

      // 2. Upload photos to Supabase Storage if present
      const uploadedImageUrls: string[] = [];
      for (const uri of photoUris) {
        try {
          const remoteUrl = await uploadDentalPhoto(uri, currentUser.id || 'pat_quick');
          if (remoteUrl) {
            uploadedImageUrls.push(remoteUrl);
          } else {
            uploadedImageUrls.push(uri);
          }
        } catch (e) {
          uploadedImageUrls.push(uri);
        }
      }

      // 3. Resolve sector teeth
      const sectorObj = SECTOR_OPTIONS.find((s) => s.id === selectedSector);
      const selectedTeeth = sectorObj ? sectorObj.teeth : [];

      // 4. Resolve symptom names in Arabic
      const resolvedSymptoms = selectedSymptoms.map((symId) => {
        const found = SYMPTOM_OPTIONS.find((s) => s.id === symId);
        return found ? (language === 'ar' ? found.labelAr : found.labelEn) : symId;
      });

      // 5. Create consultation and generate instant chat room
      const { consultationId } = await createConsultationWithChat({
        patientId: currentUser.id || `pat_${Date.now()}`,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        selectedTeeth,
        symptoms: resolvedSymptoms,
        painLevel,
        description: description.trim(),
        photoUris: uploadedImageUrls,
        xrayUris: [],
        medicalAlerts: [],
        urgencyLevel: calculateUrgency(),
      });

      setIsSubmitting(false);

      // 6. Navigate directly to Chat
      navigation.replace('Chat', {
        consultationId,
      });
    } catch (e) {
      setIsSubmitting(false);
      console.warn('Error submitting consultation:', e);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'حدث خطأ أثناء إرسال الشكوى، يرجى المحاولة ثانية.' : 'Failed to send consultation.'
      );
    }
  };

  const isAr = language === 'ar';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Top Hero Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Image source={require('../../assets/doctor_clinic.jpg')} style={styles.doctorAvatar} />
          <View style={styles.heroTextContainer}>
            <View style={styles.heroBadge}>
              <Sparkles size={12} color={Colors.white} />
              <Text style={styles.heroBadgeText}>{isAr ? 'استشارة طبية مباشرة' : 'Direct Consultation'}</Text>
            </View>
            <Text style={styles.heroTitle}>{isAr ? 'طلب فحص وتشخيص مبدئي' : 'Medical Case Intake'}</Text>
            <Text style={styles.heroSubtitle}>
              {isAr
                ? 'حدد الأعراض وموقع الألم ليتلقى د. كريم تفاصيل حالتك والرد عليك مباشرة في الشات.'
                : 'Describe your symptoms for Dr. Karim to evaluate and guide you in real-time.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Step 1: Symptoms Chips */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.stepCircle}><Text style={styles.stepNumber}>1</Text></View>
          <Text style={styles.sectionTitle}>{isAr ? 'الأعراض التي تشعر بها (اختر ما ينطبق):' : 'Select your symptoms:'}</Text>
        </View>
        <View style={styles.chipsGrid}>
          {SYMPTOM_OPTIONS.map((sym) => {
            const isSelected = selectedSymptoms.includes(sym.id);
            return (
              <TouchableOpacity
                key={sym.id}
                style={[styles.chipBtn, isSelected && styles.chipBtnActive]}
                onPress={() => toggleSymptom(sym.id)}
              >
                <Text style={styles.chipIcon}>{sym.icon}</Text>
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {isAr ? sym.labelAr : sym.labelEn}
                </Text>
                {isSelected && <CheckCircle2 size={14} color={Colors.primary} style={{ marginLeft: 4 }} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Step 2: Tooth / Jaw Location */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.stepCircle}><Text style={styles.stepNumber}>2</Text></View>
          <Text style={styles.sectionTitle}>{isAr ? 'موضع السن أو الألم:' : 'Location of Pain/Tooth:'}</Text>
        </View>
        <View style={styles.sectorGrid}>
          {SECTOR_OPTIONS.map((sec) => {
            const isSelected = selectedSector === sec.id;
            return (
              <TouchableOpacity
                key={sec.id}
                style={[styles.sectorBtn, isSelected && styles.sectorBtnActive]}
                onPress={() => setSelectedSector(sec.id)}
              >
                <Text style={[styles.sectorText, isSelected && styles.sectorTextActive]}>
                  {isAr ? sec.labelAr : sec.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Step 3: Pain Severity & Detailed Description */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.stepCircle}><Text style={styles.stepNumber}>3</Text></View>
          <Text style={styles.sectionTitle}>{isAr ? 'وصف الشكوى ومستوى الألم:' : 'Case Description & Pain Level:'}</Text>
        </View>

        {/* Pain Level Selector */}
        <Text style={styles.fieldLabel}>
          {isAr ? `شدة الألم الحالية (${painLevel}/10):` : `Pain Level (${painLevel}/10):`}
        </Text>
        <View style={styles.painRow}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            const isSelected = painLevel === num;
            const isHigh = num >= 8;
            return (
              <TouchableOpacity
                key={num}
                style={[
                  styles.painNumBtn,
                  isSelected && (isHigh ? styles.painNumBtnEmergency : styles.painNumBtnActive),
                ]}
                onPress={() => setPainLevel(num)}
              >
                <Text
                  style={[
                    styles.painNumText,
                    isSelected && styles.painNumTextActive,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Textarea Description */}
        <Text style={styles.fieldLabel}>{isAr ? 'تفاصيل الشكوى وتاريخ بدايتها:' : 'Detailed description:'}</Text>
        <TextInput
          style={styles.textArea}
          placeholder={
            isAr
              ? 'مثال: ألم بالضرس العلوي عند شرب الماء البارد بدأ منذ 3 أيام...'
              : 'E.g., Sharp pain in upper molar when drinking cold water since 3 days...'
          }
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          textAlign={isRTL ? 'right' : 'left'}
        />
      </View>

      {/* Step 4: Clinical Photos / X-Ray */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.stepCircle}><Text style={styles.stepNumber}>4</Text></View>
          <Text style={styles.sectionTitle}>{isAr ? 'إرفاق صور السن أو الأشعة (اختياري):' : 'Attach Photos / X-Rays:'}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.photoActionRow}>
          <TouchableOpacity style={styles.photoPickBtn} onPress={handlePickImage}>
            <ImageIcon size={18} color={Colors.primary} />
            <Text style={styles.photoPickBtnText}>{isAr ? 'اختيار من الاستوديو' : 'Choose from Gallery'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoPickBtn} onPress={handleTakePhoto}>
            <Camera size={18} color={Colors.primary} />
            <Text style={styles.photoPickBtnText}>{isAr ? 'التقاط صورة بالهاتف' : 'Take Photo'}</Text>
          </TouchableOpacity>
        </View>

        {/* Photos Preview Thumbnails */}
        {photoUris.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoPreviewScroll}>
            {photoUris.map((uri, idx) => (
              <View key={idx} style={styles.thumbnailBox}>
                <Image source={{ uri }} style={styles.thumbImg} />
                <TouchableOpacity style={styles.thumbDeleteBtn} onPress={() => removePhoto(idx)}>
                  <X size={14} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Step 5: Quick Contact Profile */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.stepCircle}><Text style={styles.stepNumber}>5</Text></View>
          <Text style={styles.sectionTitle}>{isAr ? 'بيانات التواصل للرد عليك:' : 'Your Contact Information:'}</Text>
        </View>

        <Text style={styles.fieldLabel}>{isAr ? 'اسم المريض بالكامل:' : 'Full Name:'}</Text>
        <View style={styles.inputBox}>
          <User size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder={isAr ? 'مثال: محمد أحمد' : 'Your name'}
            value={patientName}
            onChangeText={setPatientName}
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>

        <Text style={styles.fieldLabel}>{isAr ? 'رقم الهاتف / الواتساب:' : 'Phone / WhatsApp:'}</Text>
        <View style={styles.inputBox}>
          <Phone size={18} color={Colors.textMuted} />
          <TextInput
            style={[styles.input, { writingDirection: 'ltr' }]}
            placeholder="+20 100 000 0000"
            value={patientPhone}
            onChangeText={setPatientPhone}
            keyboardType="phone-pad"
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <>
            <Send size={20} color={Colors.white} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
            <Text style={styles.submitBtnText}>
              {isAr ? 'إرسال الشكوى وبدء المحادثة مع الطبيب' : 'Submit & Start Chat With Doctor'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  heroCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 20,
    padding: 16,
    ...Shadows.md,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  doctorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: Colors.white,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 4,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.white,
  },
  heroSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.white,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  chipBtnActive: {
    backgroundColor: '#e0f2fe',
    borderColor: Colors.primary,
  },
  chipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  sectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectorBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectorBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sectorText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  sectorTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 10,
    marginBottom: 6,
  },
  painRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  painNumBtn: {
    width: 30,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  painNumBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  painNumBtnEmergency: {
    backgroundColor: Colors.emergency,
    borderColor: Colors.emergency,
  },
  painNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  painNumTextActive: {
    color: Colors.white,
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoPickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    borderStyle: 'dashed',
    paddingVertical: 12,
    borderRadius: 12,
  },
  photoPickBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  photoPreviewScroll: {
    marginTop: 10,
  },
  thumbnailBox: {
    position: 'relative',
    marginRight: 10,
  },
  thumbImg: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbDeleteBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.emergency,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    ...Shadows.md,
    marginTop: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.white,
  },
});
