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
  Image as ImageIcon,
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
  const [categoryAr, setCategoryAr] = useState('تجميل وابتسامة');
  const [categoryEn, setCategoryEn] = useState('Cosmetics');
  const [durationWeeks, setDurationWeeks] = useState('2');
  const [beforeUri, setBeforeUri] = useState<string | null>(null);
  const [afterUri, setAfterUri] = useState<string | null>(null);

  const openAddModal = () => {
    setTitleAr('');
    setTitleEn('');
    setDescriptionAr('');
    setDescriptionEn('');
    setCategoryAr('تجميل وابتسامة');
    setCategoryEn('Cosmetics');
    setDurationWeeks('2');
    setBeforeUri(null);
    setAfterUri(null);
    setModalVisible(true);
  };

  const pickImage = async (type: 'before' | 'after') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        language === 'ar' ? 'إذن مطلوب' : 'Permission Required',
        language === 'ar' ? 'نحتاج إذن الوصول للصور' : 'Photo access permission required'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'before') {
        setBeforeUri(result.assets[0].uri);
      } else {
        setAfterUri(result.assets[0].uri);
      }
    }
  };

  const handleSaveCase = async () => {
    if (!titleAr.trim() || !beforeUri || !afterUri) {
      Alert.alert(
        language === 'ar' ? 'بيانات ناقصة' : 'Missing Info',
        language === 'ar'
          ? 'يرجى إدخال عنوان الحالة واختيار صورتي قبل وبعد'
          : 'Please enter case title and select before & after photos'
      );
      return;
    }

    setLoading(true);
    try {
      const beforeUrl = await uploadPortfolioImage(beforeUri, 'before');
      const afterUrl = await uploadPortfolioImage(afterUri, 'after');

      await addPortfolioCase({
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim() || titleAr.trim(),
        categoryAr,
        categoryEn,
        descriptionAr: descriptionAr.trim(),
        descriptionEn: descriptionEn.trim() || descriptionAr.trim(),
        beforeImageUrl: beforeUrl,
        afterImageUrl: afterUrl,
        durationWeeks: Number(durationWeeks) || 2,
      });

      setLoading(false);
      setModalVisible(false);
      Alert.alert(
        language === 'ar' ? 'تم بنجاح' : 'Success',
        language === 'ar'
          ? 'تمت إضافة الحالة لمعرض العيادة بنجاح'
          : 'Case added to portfolio successfully'
      );
    } catch (err: any) {
      setLoading(false);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        err?.message || (language === 'ar' ? 'فشل حفظ الحالة' : 'Failed to save case')
      );
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete',
      language === 'ar'
        ? 'هل أنت متأكد من حذف هذه الحالة من المعرض؟'
        : 'Are you sure you want to delete this case?',
      [
        { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ar' ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: () => deletePortfolioCase(id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          {isRTL ? <ArrowRight size={20} color={Colors.white} /> : <ArrowLeft size={20} color={Colors.white} />}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {language === 'ar' ? 'معرض حالات العيادة (Before & After)' : 'Portfolio Management'}
          </Text>
          <Text style={styles.headerSub}>
            {language === 'ar' ? 'إضافة وتعديل صور الحالات ونتائج العلاج' : 'Showcase treatment transformations'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addHeaderBtn} onPress={openAddModal}>
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {portfolioCases.length === 0 ? (
          <View style={styles.emptyState}>
            <Sparkles size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {language === 'ar' ? 'لا توجد حالات مسجلة بالمعرض بعد' : 'No portfolio cases yet'}
            </Text>
            <Text style={styles.emptySub}>
              {language === 'ar'
                ? 'أضف صور حالات العلاج الناجحة (قبل وبعد) لتظهر للمرضى في بروفايل عيادتك'
                : 'Add before & after transformations to display on your profile'}
            </Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={openAddModal}>
              <Plus size={18} color={Colors.white} />
              <Text style={styles.emptyAddBtnText}>
                {language === 'ar' ? 'إضافة حالة جديدة' : 'Add New Case'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.casesList}>
            {portfolioCases.map((item) => (
              <View key={item.id} style={styles.caseCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.caseTitle}>
                      {language === 'ar' ? item.titleAr : item.titleEn}
                    </Text>
                    <Text style={styles.caseCategory}>
                      {language === 'ar' ? item.categoryAr : item.categoryEn} • {item.durationWeeks} {language === 'ar' ? 'أسابيع' : 'weeks'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Trash2 size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>

                {/* Images Row */}
                <View style={styles.imagesRow}>
                  <View style={styles.imageBox}>
                    <Image source={{ uri: item.beforeImageUrl }} style={styles.caseImage} />
                    <View style={[styles.badge, styles.badgeBefore]}>
                      <Text style={styles.badgeText}>
                        {language === 'ar' ? 'قبل (Before)' : 'Before'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.imageBox}>
                    <Image source={{ uri: item.afterImageUrl }} style={styles.caseImage} />
                    <View style={[styles.badge, styles.badgeAfter]}>
                      <Text style={styles.badgeText}>
                        {language === 'ar' ? 'بعد (After)' : 'After'}
                      </Text>
                    </View>
                  </View>
                </View>

                {!!item.descriptionAr && (
                  <Text style={styles.caseDesc}>
                    {language === 'ar' ? item.descriptionAr : item.descriptionEn}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'ar' ? 'إضافة حالة جديدة للمعرض 📸' : 'Add New Portfolio Case 📸'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {language === 'ar' ? 'عنوان الحالة' : 'Case Title'} *
                </Text>
                <TextInput
                  style={styles.formInput}
                  value={titleAr}
                  onChangeText={setTitleAr}
                  placeholder={language === 'ar' ? 'مثال: تجميل وابتسامة هوليود بالفينير' : 'e.g. Hollywood Smile'}
                  placeholderTextColor={Colors.textMuted}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {language === 'ar' ? 'التصنيف' : 'Category'}
                </Text>
                <View style={styles.categoryRow}>
                  {['تجميل وابتسامة', 'تقويم أسنان', 'زراعة أسنان', 'حشو تجميلي'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catPill, categoryAr === cat && styles.catPillActive]}
                      onPress={() => setCategoryAr(cat)}
                    >
                      <Text style={[styles.catText, categoryAr === cat && styles.catTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Photo Selectors */}
              <View style={styles.photosPickerRow}>
                {/* Before Photo */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>
                    {language === 'ar' ? 'صورة قبل العلاج' : 'Before Photo'} *
                  </Text>
                  <TouchableOpacity
                    style={styles.pickerBox}
                    onPress={() => pickImage('before')}
                  >
                    {beforeUri ? (
                      <Image source={{ uri: beforeUri }} style={styles.pickerImage} />
                    ) : (
                      <View style={styles.pickerPlaceholder}>
                        <Camera size={24} color={Colors.primary} />
                        <Text style={styles.pickerPlaceholderText}>
                          {language === 'ar' ? 'اختر صورة قبل' : 'Choose Before'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* After Photo */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>
                    {language === 'ar' ? 'صورة بعد العلاج' : 'After Photo'} *
                  </Text>
                  <TouchableOpacity
                    style={styles.pickerBox}
                    onPress={() => pickImage('after')}
                  >
                    {afterUri ? (
                      <Image source={{ uri: afterUri }} style={styles.pickerImage} />
                    ) : (
                      <View style={styles.pickerPlaceholder}>
                        <Camera size={24} color="#16a34a" />
                        <Text style={[styles.pickerPlaceholderText, { color: '#16a34a' }]}>
                          {language === 'ar' ? 'اختر صورة بعد' : 'Choose After'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {language === 'ar' ? 'مدة العلاج (بالأسابيع)' : 'Duration (Weeks)'}
                </Text>
                <TextInput
                  style={styles.formInput}
                  value={durationWeeks}
                  onChangeText={setDurationWeeks}
                  keyboardType="numeric"
                  placeholder="2"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {language === 'ar' ? 'تفاصيل ووصف الحالة' : 'Case Description'}
                </Text>
                <TextInput
                  style={styles.formTextArea}
                  value={descriptionAr}
                  onChangeText={setDescriptionAr}
                  placeholder={language === 'ar' ? 'صف الإجراء الطبي والنتيجة المميزة...' : 'Describe treatment procedure...'}
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveCaseBtn, loading && styles.saveBtnDisabled]}
              onPress={handleSaveCase}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.saveCaseBtnText}>
                  {language === 'ar' ? 'حفظ ونشر الحالة بالمعرض ✨' : 'Save & Publish Case ✨'}
                </Text>
              )}
            </TouchableOpacity>
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
  },
  header: {
    backgroundColor: Colors.primaryDark,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  addHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    marginTop: 40,
    gap: 10,
    ...Shadows.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyAddBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
    marginTop: 10,
  },
  emptyAddBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  casesList: {
    gap: 14,
  },
  caseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  caseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  caseCategory: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 6,
  },
  imageBox: {
    flex: 1,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.border,
  },
  caseImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeBefore: {
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
  },
  badgeAfter: {
    backgroundColor: 'rgba(22, 163, 74, 0.85)',
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  caseDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  formGroup: {
    marginBottom: 12,
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  formInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  formTextArea: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: Colors.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  catPillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  catText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  catTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  photosPickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  pickerBox: {
    height: 100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  pickerPlaceholder: {
    alignItems: 'center',
    gap: 4,
  },
  pickerPlaceholderText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  pickerImage: {
    width: '100%',
    height: '100%',
  },
  saveCaseBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
    ...Shadows.md,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveCaseBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
