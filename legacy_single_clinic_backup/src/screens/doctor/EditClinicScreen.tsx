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
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Save,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  User,
  Award,
  FileText,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { uploadDoctorAvatar, uploadDoctorCover } from '../../services/supabaseStorage';

export const EditClinicScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { language, isRTL, clinicSettings, updateClinicSettings } = useApp();

  const [loading, setLoading] = useState(false);
  const [showClinicInfo, setShowClinicInfo] = useState(clinicSettings.showClinicInfo !== false);
  const [promoBadgeEnabled, setPromoBadgeEnabled] = useState(clinicSettings.promoBadgeEnabled !== false);
  const [promoBadgeText, setPromoBadgeText] = useState(clinicSettings.promoBadgeText || '✨ مجاناً لفترة محدودة');
  const [doctorName, setDoctorName] = useState(clinicSettings.doctorName);
  const [doctorTitle, setDoctorTitle] = useState(clinicSettings.doctorTitle);
  const [doctorBio, setDoctorBio] = useState(clinicSettings.doctorBio);
  const [phoneNumber, setPhoneNumber] = useState(clinicSettings.phoneNumber);
  const [whatsappNumber, setWhatsappNumber] = useState(clinicSettings.whatsappNumber);
  const [locationAddress, setLocationAddress] = useState(clinicSettings.locationAddress);
  const [locationMapsUrl, setLocationMapsUrl] = useState(clinicSettings.locationMapsUrl);
  const [workingHours, setWorkingHours] = useState(clinicSettings.workingHours);
  const [avatarUri, setAvatarUri] = useState<string | null>(clinicSettings.avatarUrl || null);
  const [coverUri, setCoverUri] = useState<string | null>(clinicSettings.coverImageUrl || null);

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const handlePickCover = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCoverUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Cover image picker error:', err);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      let finalAvatarUrl = clinicSettings.avatarUrl;
      let finalCoverUrl = clinicSettings.coverImageUrl;

      // Upload new avatar if changed and is local file
      if (avatarUri && avatarUri !== clinicSettings.avatarUrl && !avatarUri.startsWith('http')) {
        finalAvatarUrl = await uploadDoctorAvatar(avatarUri);
      }

      // Upload new cover if changed
      if (coverUri && coverUri !== clinicSettings.coverImageUrl && !coverUri.startsWith('http')) {
        finalCoverUrl = await uploadDoctorCover(coverUri);
      }

      await updateClinicSettings({
        doctorName: doctorName.trim(),
        doctorTitle: doctorTitle.trim(),
        doctorBio: doctorBio.trim(),
        phoneNumber: phoneNumber.trim(),
        whatsappNumber: whatsappNumber.trim(),
        locationAddress: locationAddress.trim(),
        locationMapsUrl: locationMapsUrl.trim(),
        workingHours: workingHours.trim(),
        showClinicInfo,
        promoBadgeEnabled,
        promoBadgeText: promoBadgeText.trim(),
        avatarUrl: finalAvatarUrl,
        coverImageUrl: finalCoverUrl,
      });

      Alert.alert(
        language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved Successfully',
        language === 'ar'
          ? 'تم تحديث بيانات العيادة والطبيب ومزامنتها على السحابة.'
          : 'Clinic details and doctor profile updated.'
      );

      if (navigation?.goBack) {
        navigation.goBack();
      }
    } catch (err: any) {
      Alert.alert(language === 'ar' ? 'خطأ' : 'Error', err?.message || 'تعذر حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
          {isRTL ? <ArrowRight size={20} color={Colors.textPrimary} /> : <ArrowLeft size={20} color={Colors.textPrimary} />}
        </TouchableOpacity>
        <Text style={styles.screenTitle}>
          {language === 'ar' ? 'تعديل بيانات العيادة والطبيب' : 'Edit Clinic & Doctor Profile'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Doctor Photos Setup */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>
          {language === 'ar' ? '📸 صور الطبيب والعيادة:' : '📸 Doctor & Clinic Photos:'}
        </Text>

        <View style={styles.photosRow}>
          {/* Avatar Photo */}
          <View style={styles.photoBox}>
            <Text style={styles.photoLabel}>
              {language === 'ar' ? 'الصورة الشخصية' : 'Doctor Avatar'}
            </Text>
            <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <Image source={require('../../../assets/doctor_clinic.jpg')} style={styles.avatarImg} />
              )}
              <View style={styles.cameraIconBadge}>
                <Camera size={14} color={Colors.white} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Cover Photo */}
          <View style={[styles.photoBox, { flex: 1.5 }]}>
            <Text style={styles.photoLabel}>
              {language === 'ar' ? 'صورة الغلاف / النبذة' : 'Cover / Bio Image'}
            </Text>
            <TouchableOpacity style={styles.coverWrapper} onPress={handlePickCover}>
              {coverUri ? (
                <Image source={{ uri: coverUri }} style={styles.coverImg} />
              ) : (
                <Image source={require('../../../assets/doctor_formal.jpg')} style={styles.coverImg} />
              )}
              <View style={styles.cameraIconBadge}>
                <Camera size={14} color={Colors.white} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Doctor Bio & Credentials */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>
          {language === 'ar' ? '👨‍⚕️ بيانات الطبيب:' : '👨‍⚕️ Doctor Credentials:'}
        </Text>

        <Text style={styles.fieldLabel}>{language === 'ar' ? 'اسم الطبيب:' : 'Doctor Name:'}</Text>
        <TextInput
          style={styles.input}
          value={doctorName}
          onChangeText={setDoctorName}
          textAlign={isRTL ? 'right' : 'left'}
        />

        <Text style={styles.fieldLabel}>{language === 'ar' ? 'اللقب المهني / التخصص:' : 'Doctor Title:'}</Text>
        <TextInput
          style={styles.input}
          value={doctorTitle}
          onChangeText={setDoctorTitle}
          textAlign={isRTL ? 'right' : 'left'}
        />

        <Text style={styles.fieldLabel}>{language === 'ar' ? 'النبذة المهنية (Bio):' : 'Professional Bio:'}</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={doctorBio}
          onChangeText={setDoctorBio}
          multiline
          textAlign={isRTL ? 'right' : 'left'}
        />
      </View>

      {/* Clinic Visibility Control Switch */}
      <View style={[styles.card, { backgroundColor: '#f0fdf4', borderColor: '#86efac', borderWidth: 1.5 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginEnd: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#166534', marginBottom: 2 }}>
              {language === 'ar' ? '🏥 إظهار كارت بيانات العيادة للمرضى' : '🏥 Show Clinic Info Card to Patients'}
            </Text>
            <Text style={{ fontSize: 11, color: '#475569' }}>
              {language === 'ar'
                ? 'التحكم في ظهور كارت (العنوان، الهاتف، المواعيد) في شاشة حسابي لدى المريض.'
                : 'Toggle visibility of address, phone, and hours on patient profile.'}
            </Text>
          </View>
          <Switch
            value={showClinicInfo}
            onValueChange={setShowClinicInfo}
            trackColor={{ false: '#cbd5e1', true: '#22c55e' }}
          />
        </View>
      </View>

      {/* Promotional "Free for a Limited Time" Badge Controller */}
      <View style={[styles.card, { backgroundColor: '#fffbeb', borderColor: '#fde68a', borderWidth: 1.5 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: promoBadgeEnabled ? 10 : 0 }}>
          <View style={{ flex: 1, marginEnd: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#92400e', marginBottom: 2 }}>
              {language === 'ar' ? '🎁 شارة العرض المجاني الترويجي' : '🎁 Free Promo Ribbon Badge'}
            </Text>
            <Text style={{ fontSize: 11, color: '#78350f' }}>
              {language === 'ar'
                ? 'إظهار شريط لامع على كارت طلب الاستشارة (مجاناً لفترة محدودة).'
                : 'Display a shining promo badge on the consultation card.'}
            </Text>
          </View>
          <Switch
            value={promoBadgeEnabled}
            onValueChange={setPromoBadgeEnabled}
            trackColor={{ false: '#cbd5e1', true: '#f59e0b' }}
          />
        </View>

        {promoBadgeEnabled && (
          <View style={{ marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#fef3c7' }}>
            <Text style={[styles.fieldLabel, { color: '#92400e', marginTop: 0 }]}>
              {language === 'ar' ? 'النص الظاهر على شارة العرض:' : 'Badge Text:'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#ffffff', borderColor: '#fcd34d' }]}
              value={promoBadgeText}
              onChangeText={setPromoBadgeText}
              placeholder="✨ مجاناً لفترة محدودة"
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>
        )}
      </View>

      {/* Clinic Contact & Working Hours */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>
          {language === 'ar' ? '📍 معلومات التواصل ومواعيد العمل:' : '📍 Contact & Working Hours:'}
        </Text>

        <Text style={styles.fieldLabel}>{language === 'ar' ? 'رقم الهاتف المباشر:' : 'Phone Number:'}</Text>
        <TextInput
          style={[styles.input, { writingDirection: 'ltr' }]}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          textAlign={isRTL ? 'right' : 'left'}
        />

        <Text style={styles.fieldLabel}>{language === 'ar' ? 'رقم الواتساب:' : 'WhatsApp Number:'}</Text>
        <TextInput
          style={[styles.input, { writingDirection: 'ltr' }]}
          value={whatsappNumber}
          onChangeText={setWhatsappNumber}
          keyboardType="phone-pad"
          textAlign={isRTL ? 'right' : 'left'}
        />

        <Text style={styles.fieldLabel}>{language === 'ar' ? 'عنوان العيادة:' : 'Clinic Address:'}</Text>
        <TextInput
          style={styles.input}
          value={locationAddress}
          onChangeText={setLocationAddress}
          textAlign={isRTL ? 'right' : 'left'}
        />

        <Text style={styles.fieldLabel}>{language === 'ar' ? 'مواعيد وساعات العمل:' : 'Working Hours:'}</Text>
        <TextInput
          style={styles.input}
          value={workingHours}
          onChangeText={setWorkingHours}
          textAlign={isRTL ? 'right' : 'left'}
        />
      </View>

      {/* Save Action Button */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <>
            <Save size={18} color={Colors.white} />
            <Text style={styles.saveBtnText}>
              {language === 'ar' ? 'حفظ وتحديث بيانات العيادة' : 'Save & Publish Updates'}
            </Text>
          </>
        )}
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
    paddingTop: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    ...Shadows.sm,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 14,
  },
  photosRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  photoBox: {
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  coverWrapper: {
    width: '100%',
    height: 80,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#0f172a',
  },
  coverImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    ...Shadows.md,
    marginTop: 6,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
