import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Clock,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { DentalService } from '../../types';

export const ManageServicesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { language, isRTL, services, addService, updateService, deleteService } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [price, setPrice] = useState('500');
  const [duration, setDuration] = useState('30');
  const [category, setCategory] = useState<'checkup' | 'restoration' | 'endodontics' | 'cosmetics' | 'surgery' | 'orthodontics'>('cosmetics');

  const openAddModal = () => {
    setEditingServiceId(null);
    setNameAr('');
    setNameEn('');
    setDescriptionAr('');
    setDescriptionEn('');
    setPrice('500');
    setDuration('30');
    setCategory('cosmetics');
    setModalVisible(true);
  };

  const openEditModal = (service: DentalService) => {
    setEditingServiceId(service.id);
    setNameAr(service.nameAr);
    setNameEn(service.nameEn);
    setDescriptionAr(service.descriptionAr);
    setDescriptionEn(service.descriptionEn);
    setPrice(String(service.estimatedPrice));
    setDuration(String(service.durationMinutes));
    setCategory(service.category);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!nameAr.trim() || !price.trim()) {
      Alert.alert(language === 'ar' ? 'تنبيه' : 'Alert', language === 'ar' ? 'يرجى إدخال اسم الخدمة وسعرها' : 'Please enter service name and price');
      return;
    }

    try {
      setLoading(true);
      const parsedPrice = parseInt(price, 10) || 0;
      const parsedDuration = parseInt(duration, 10) || 30;

      if (editingServiceId) {
        await updateService({
          id: editingServiceId,
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim() || nameAr.trim(),
          descriptionAr: descriptionAr.trim(),
          descriptionEn: descriptionEn.trim() || descriptionAr.trim(),
          estimatedPrice: parsedPrice,
          durationMinutes: parsedDuration,
          iconName: 'Sparkles',
          category,
        });
      } else {
        await addService({
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim() || nameAr.trim(),
          descriptionAr: descriptionAr.trim(),
          descriptionEn: descriptionEn.trim() || descriptionAr.trim(),
          estimatedPrice: parsedPrice,
          durationMinutes: parsedDuration,
          iconName: 'Sparkles',
          category,
        });
      }

      setModalVisible(false);
      Alert.alert(
        language === 'ar' ? 'نجاح' : 'Success',
        language === 'ar' ? 'تم حفظ الخدمة ومزامنتها بنجاح' : 'Service saved successfully'
      );
    } catch (err: any) {
      Alert.alert(language === 'ar' ? 'خطأ' : 'Error', err?.message || 'تعذر حفظ الخدمة');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (service: DentalService) => {
    Alert.alert(
      language === 'ar' ? 'حذف الخدمة' : 'Delete Service',
      language === 'ar' ? `هل أنت متأكد من حذف "${service.nameAr}"؟` : `Delete "${service.nameEn}"?`,
      [
        { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ar' ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteService(service.id);
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
          {language === 'ar' ? 'إدارة الخدمات والأسعار' : 'Manage Clinic Services'}
        </Text>
        <TouchableOpacity style={styles.addTopBtn} onPress={openAddModal}>
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Services List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {services.map((service) => (
          <View key={service.id} style={styles.serviceCard}>
            <View style={styles.serviceMain}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>
                  {language === 'ar' ? service.nameAr : service.nameEn}
                </Text>
                <Text style={styles.serviceDesc} numberOfLines={2}>
                  {language === 'ar' ? service.descriptionAr : service.descriptionEn}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={styles.priceBadge}>
                    <DollarSign size={12} color={Colors.primary} />
                    <Text style={styles.priceText}>{service.estimatedPrice} ج.م</Text>
                  </View>
                  <View style={styles.durationBadge}>
                    <Clock size={12} color={Colors.textSecondary} />
                    <Text style={styles.durationText}>{service.durationMinutes} دقيقة</Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsCol}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => openEditModal(service)}
                >
                  <Edit2 size={16} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(service)}
                >
                  <Trash2 size={16} color={Colors.emergency} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add / Edit Service Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingServiceId
                  ? (language === 'ar' ? 'تعديل الخدمة' : 'Edit Service')
                  : (language === 'ar' ? 'إضافة خدمة جديدة' : 'Add New Service')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>{language === 'ar' ? 'اسم الخدمة (بالعربية):' : 'Service Name (Arabic):'}</Text>
              <TextInput
                style={styles.input}
                value={nameAr}
                onChangeText={setNameAr}
                placeholder="مثال: حشوات ليزر تجميلية"
                textAlign={isRTL ? 'right' : 'left'}
              />

              <Text style={styles.label}>{language === 'ar' ? 'اسم الخدمة (بالإنجليزي):' : 'Service Name (English):'}</Text>
              <TextInput
                style={styles.input}
                value={nameEn}
                onChangeText={setNameEn}
                placeholder="e.g. Composite Laser Filling"
                textAlign="left"
              />

              <Text style={styles.label}>{language === 'ar' ? 'الوصف بالعربية:' : 'Description (Arabic):'}</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={descriptionAr}
                onChangeText={setDescriptionAr}
                placeholder="وصف تفصيلي للخدمة وإجراءاتها..."
                multiline
                textAlign={isRTL ? 'right' : 'left'}
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>{language === 'ar' ? 'السعر (ج.م):' : 'Price (EGP):'}</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.label}>{language === 'ar' ? 'المدة (دقيقة):' : 'Duration (Mins):'}</Text>
                  <TextInput
                    style={styles.input}
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.saveModalBtn} onPress={handleSave} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Check size={18} color={Colors.white} />
                    <Text style={styles.saveModalBtnText}>
                      {language === 'ar' ? 'حفظ الخدمة' : 'Save Service'}
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
  serviceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    ...Shadows.sm,
  },
  serviceMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceInfo: {
    flex: 1,
    paddingRight: 10,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  actionsCol: {
    gap: 8,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
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
  row: {
    flexDirection: 'row',
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
