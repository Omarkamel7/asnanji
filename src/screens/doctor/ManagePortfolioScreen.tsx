import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Plus,
  Trash2,
  Camera,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Layers,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { uploadPortfolioImage } from '../../services/supabaseStorage';
import { BeforeAfterCase } from '../../types';

export const ManagePortfolioScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { language, isRTL, portfolioCases, addPortfolioCase, deletePortfolioCase } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [categoryAr, setCategoryAr] = useState('تجميل الأسنان');
  const [categoryEn, setCategoryEn] = useState('Cosmetics');
  const [durationWeeks, setDurationWeeks] = useState('2');
  const [beforeUri, setBeforeUri] = useState<string | null>(null);
  const [afterUri, setAfterUri] = useState<string | null>(null);

  const openAddModal = () => {
    setTitleAr('');
    setTitleEn('');
    setDescriptionAr('');
    setDescriptionEn('');
    setCategoryAr('تجميل الأسنان');
    setCategoryEn('Cosmetics');
    setDurationWeeks('2');
    setBeforeUri(null);
    setAfterUri(null);
    setModalVisible(true);
  };

  const handlePickBefore = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setBeforeUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Pick before image error:', err);
    }
  };

  const handlePickAfter = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAfterUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Pick after image error:', err);
    }
  };

  const handleSave = async () => {
    if (!titleAr.trim() || !beforeUri || !afterUri) {
      Alert.alert(
        language === 'ar' ? 'تنبيه' : 'Alert',
        language === 'ar'
          ? 'يرجى إدخال عنوان الحالة وتحديد صورتي (قبل وبعد)'
          : 'Please enter case title and select both Before & After photos.'
      );
      return;
    }

    try {
      setLoading(true);

      // Upload both photos to Supabase Storage
      const uploadedBeforeUrl = await uploadPortfolioImage(beforeUri, 'before');
      const uploadedAfterUrl = await uploadPortfolioImage(afterUri, 'after');

      await addPortfolioCase({
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim() || titleAr.trim(),
        categoryAr: categoryAr.trim(),
        categoryEn: categoryEn.trim() || 'Cosmetics',
        descriptionAr: descriptionAr.trim(),
        descriptionEn: descriptionEn.trim() || descriptionAr.trim(),
        beforeImageUrl: uploadedBeforeUrl,
        afterImageUrl: uploadedAfterUrl,
        durationWeeks: parseInt(durationWeeks, 10) || 2,
        dentistName: 'د. كريم أبو بكر',
      });

      setModalVisible(false);
      Alert.alert(
        language === 'ar' ? 'تم النشر بنجاح' : 'Success',
        language === 'ar'
          ? 'تمت إضافة الحالة السريرية إلى معرض الأعمال ومزامنتها.'
          : 'Clinical case added to portfolio.'
      );
    } catch (err: any) {
      Alert.alert(language === 'ar' ? 'خطأ' : 'Error', err?.message || 'تعذر إضافة الحالة');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (item: BeforeAfterCase) => {
    Alert.alert(
      language === 'ar' ? 'حذف الحالة' : 'Delete Case',
      language === 'ar' ? `هل أنت متأكد من حذف "${item.titleAr}"؟` : `Delete "${item.titleEn}"?`,
      [
        { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ar' ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePortfolioCase(item.id);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
          {isRTL ? <ArrowRight size={20} color={Colors.textPrimary} /> : <ArrowLeft size={20} color={Colors.textPrimary} />}
        </TouchableOpacity>
        <Text style={styles.screenTitle}>
          {language === 'ar' ? 'إدارة معرض الأعمال (قبل / بعد)' : 'Manage Portfolio (Before & After)'}
        </Text>
        <TouchableOpacity style={styles.addTopBtn} onPress={openAddModal}>
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Portfolio Cases List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {portfolioCases.map((item) => (
          <View key={item.id} style={styles.caseCard}>
            {/* Before / After Images Preview */}
            <View style={styles.imagesRow}>
              <View style={styles.imageBox}>
                <Image source={{ uri: item.beforeImageUrl }} style={styles.caseImg} />
                <View style={styles.imageTagBefore}>
                  <Text style={styles.imageTagText}>{language === 'ar' ? 'قبل' : 'Before'}</Text>
                </View>
              </View>
              <View style={styles.imageBox}>
                <Image source={{ uri: item.afterImageUrl }} style={styles.caseImg} />
                <View style={styles.imageTagAfter}>
                  <Text style={styles.imageTagText}>{language === 'ar' ? 'بعد' : 'After'}</Text>
                </View>
              </View>
            </View>

            {/* Case Info */}
            <View style={styles.caseInfo}>
              <View style={styles.caseHeader}>
                <Text style={styles.caseCategory}>
                  {language === 'ar' ? item.categoryAr : item.categoryEn}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item)}>
                  <Trash2 size={16} color={Colors.emergency} />
                </TouchableOpacity>
              </View>

              <Text style={styles.caseTitle}>
                {language === 'ar' ? item.titleAr : item.titleEn}
              </Text>
              <Text style={styles.caseDesc} numberOfLines={2}>
                {language === 'ar' ? item.descriptionAr : item.descriptionEn}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add New Case Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'ar' ? 'إضافة حالة سريرية جديدة' : 'Add Clinical Case'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Photo Selectors */}
              <Text style={styles.label}>{language === 'ar' ? '📸 صور الحالة (قبل وبعد):' : '📸 Case Images:'}</Text>
              <View style={styles.photoPickerRow}>
                <TouchableOpacity style={styles.photoPickBtn} onPress={handlePickBefore}>
                  {beforeUri ? (
                    <Image source={{ uri: beforeUri }} style={styles.pickedImg} />
                  ) : (
                    <View style={styles.placeholderBox}>
                      <Camera size={20} color={Colors.primary} />
                      <Text style={styles.placeholderText}>{language === 'ar' ? 'صورة قبل' : 'Before Photo'}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.photoPickBtn} onPress={handlePickAfter}>
                  {afterUri ? (
                    <Image source={{ uri: afterUri }} style={styles.pickedImg} />
                  ) : (
                    <View style={styles.placeholderBox}>
                      <Camera size={20} color={Colors.secondary} />
                      <Text style={styles.placeholderText}>{language === 'ar' ? 'صورة بعد' : 'After Photo'}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>{language === 'ar' ? 'عنوان الحالة بالعربية:' : 'Title (Arabic):'}</Text>
              <TextInput
                style={styles.input}
                value={titleAr}
                onChangeText={setTitleAr}
                placeholder="مثال: تصميم ابتسامة هوليوود بالفينير"
                textAlign={isRTL ? 'right' : 'left'}
              />

              <Text style={styles.label}>{language === 'ar' ? 'عنوان الحالة بالإنجليزي:' : 'Title (English):'}</Text>
              <TextInput
                style={styles.input}
                value={titleEn}
                onChangeText={setTitleEn}
                placeholder="e.g. Full Smile Makeover with Veneers"
                textAlign="left"
              />

              <Text style={styles.label}>{language === 'ar' ? 'التصنيف:' : 'Category:'}</Text>
              <TextInput
                style={styles.input}
                value={categoryAr}
                onChangeText={setCategoryAr}
                placeholder="تجميل الأسنان / زراعة / تقويم"
                textAlign={isRTL ? 'right' : 'left'}
              />

              <Text style={styles.label}>{language === 'ar' ? 'شرح تفاصيل الحالة:' : 'Description:'}</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={descriptionAr}
                onChangeText={setDescriptionAr}
                placeholder="تفاصيل الإجراء العلاجي والنتائج المحققة..."
                multiline
                textAlign={isRTL ? 'right' : 'left'}
              />

              <TouchableOpacity style={styles.saveModalBtn} onPress={handleSave} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Check size={18} color={Colors.white} />
                    <Text style={styles.saveModalBtnText}>
                      {language === 'ar' ? 'نشر الحالة في المعرض' : 'Publish to Portfolio'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
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
  addTopBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  caseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    ...Shadows.sm,
  },
  imagesRow: {
    flexDirection: 'row',
    height: 140,
    backgroundColor: '#0f172a',
  },
  imageBox: {
    flex: 1,
    position: 'relative',
  },
  caseImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageTagBefore: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  imageTagAfter: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(2, 132, 199, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  imageTagText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  caseInfo: {
    padding: 12,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  caseCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  caseTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  caseDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: 6,
  },
  photoPickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  photoPickBtn: {
    flex: 1,
    height: 100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  pickedImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  placeholderText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  saveModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 14,
    marginBottom: 20,
    ...Shadows.md,
  },
  saveModalBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
