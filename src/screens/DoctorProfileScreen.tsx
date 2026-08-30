import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, MapPin, Star, Phone, MessageCircle, Calendar, Award, ShieldCheck, Clock } from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { DoctorProfile } from '../types/doctor';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { supabase } from '../services/supabase';

const blurhash = 'LGF5]+Yk^6#M@-5c';

export const DoctorProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { doctorId } = route.params as { doctorId: string };
  const { doctors, language, isRTL } = useApp();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(
    doctors.find(d => d.id === doctorId) || null
  );
  const [loading, setLoading] = useState(!doctor);
  const [portfolio, setPortfolio] = useState<any[]>([]);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        if (!doctor) {
          const { data, error } = await supabase
            .from('doctor_profiles')
            .select('*, profiles:id(full_name, phone)')
            .eq('id', doctorId)
            .single();
          if (data) {
            setDoctor({
              id: data.id,
              slug: data.slug,
              specialty: data.specialty || (language === 'ar' ? 'استشاري طب وجراحة الأسنان' : 'Dental Specialist'),
              bio: data.bio || '',
              clinicAddress: data.clinic_address || '',
              consultationFee: data.consultation_fee || 350,
              avatarUrl: data.avatar_url,
              isAcceptingPatients: data.is_accepting_patients ?? true,
              rating: Number(data.rating) || 4.9,
              profileData: {
                id: data.id,
                fullName: data.profiles?.full_name || (language === 'ar' ? 'طبيب متخصص' : 'Doctor'),
                phone: data.profiles?.phone || '',
                role: 'doctor'
              }
            });
          }
        }
        
        const { data: portData } = await supabase
          .from('doctor_portfolio')
          .select('*')
          .eq('doctor_id', doctorId);
        
        if (portData && portData.length > 0) {
          setPortfolio(portData);
        } else {
          // Fallback to portfolio_cases
          const { data: globalPort } = await supabase.from('portfolio_cases').select('*').limit(6);
          if (globalPort) setPortfolio(globalPort);
        }
      } catch (err) {
        console.error('Error loading doctor profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [doctorId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{language === 'ar' ? 'جاري تحميل ملف الطبيب...' : 'Loading Doctor Profile...'}</Text>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{language === 'ar' ? 'لم يتم العثور على الطبيب المطلوب.' : 'Doctor not found.'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{language === 'ar' ? 'الرجوع' : 'Go Back'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header Navigation */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={Colors.textPrimary} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{language === 'ar' ? 'الملف الطبي' : 'Doctor Profile'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Doctor Header Card */}
        <View style={styles.doctorHeaderCard}>
          <Image 
            source={doctor.avatarUrl ? { uri: doctor.avatarUrl } : require('../../assets/doctor_clinic.jpg')} 
            style={styles.avatarLarge}
            contentFit="cover"
            placeholder={blurhash}
          />
          <Text style={styles.doctorName}>{doctor.profileData?.fullName}</Text>
          <Text style={styles.doctorSpecialty}>{doctor.specialty || (language === 'ar' ? 'استشاري طب وجراحة الأسنان' : 'Dental Specialist')}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.ratingBadge}>
              <Star size={16} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{doctor.rating.toFixed(1)}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={16} color={Colors.primary} />
              <Text style={styles.verifiedText}>{language === 'ar' ? 'طبيب معتمد' : 'Verified Doctor'}</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{language === 'ar' ? 'سعر الكشف' : 'Consultation Fee'}</Text>
            <Text style={styles.statValue}>{doctor.consultationFee || 350} {language === 'ar' ? 'ج.م' : 'EGP'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{language === 'ar' ? 'التقييم' : 'Rating'}</Text>
            <Text style={styles.statValue}>⭐ {doctor.rating.toFixed(1)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{language === 'ar' ? 'الخبرة' : 'Experience'}</Text>
            <Text style={styles.statValue}>+12 {language === 'ar' ? 'سنة' : 'Years'}</Text>
          </View>
        </View>

        {!doctor.isAcceptingPatients && (
          <View style={styles.closedBanner}>
            <Clock size={18} color={Colors.emergency} />
            <Text style={styles.closedText}>
              {language === 'ar' ? 'العيادة غير متاحة لاستقبال مرضى جدد حالياً' : 'Clinic Temporarily Closed for New Patients'}
            </Text>
          </View>
        )}

        {/* Bio Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{language === 'ar' ? 'نبذة عن الطبيب' : 'About the Doctor'}</Text>
          <Text style={styles.sectionBody}>
            {doctor.bio || (language === 'ar' ? 'طبيب أسنان متخصص يقدم رعاية صحية وتجميلية متكاملة للأسنان باستخدام أحدث التقنيات.' : 'Specialized dental professional providing comprehensive care.')}
          </Text>
        </View>

        {/* Location Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{language === 'ar' ? 'موقع وعنوان العيادة' : 'Clinic Location'}</Text>
          <View style={styles.addressRow}>
            <MapPin size={18} color={Colors.primary} />
            <Text style={styles.addressText}>
              {doctor.clinicAddress || (language === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt')}
            </Text>
          </View>
        </View>

        {/* Portfolio Cases */}
        {portfolio.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{language === 'ar' ? 'معرض الحالات قبل وبعد' : 'Before & After Cases'}</Text>
            {portfolio.map((item, idx) => (
              <View key={item.id || idx} style={styles.portfolioItem}>
                <Text style={styles.caseTitle}>{item.title || item.title_ar || (language === 'ar' ? 'حالة تجميل أسنان' : 'Smile Makeover')}</Text>
                {(item.before_image_url || item.beforeImageUrl) && (item.after_image_url || item.afterImageUrl) ? (
                  <BeforeAfterSlider 
                    item={{
                      id: item.id || String(idx),
                      beforeImageUrl: item.before_image_url || item.beforeImageUrl || '',
                      afterImageUrl: item.after_image_url || item.afterImageUrl || '',
                      titleAr: item.title || item.title_ar || 'حالة علاج وتجميل أسنان',
                      titleEn: item.title || item.title_en || 'Smile Makeover Case',
                      categoryAr: 'تجميل الأسنان',
                      categoryEn: 'Cosmetics',
                      descriptionAr: item.description || item.description_ar || '',
                      descriptionEn: item.description || item.description_en || '',
                      durationWeeks: item.duration_weeks || item.durationWeeks || 2,
                      createdAt: item.created_at || new Date().toISOString()
                    }}
                  />
                ) : null}
                {item.description && (
                  <Text style={styles.caseDescription}>{item.description || item.description_ar}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        {doctor?.profileData?.phone ? (
          <TouchableOpacity 
            style={styles.callBtn}
            onPress={() => Linking.openURL(`tel:${doctor?.profileData?.phone}`)}
          >
            <Phone size={20} color={Colors.primary} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity 
          style={[styles.consultBtn, !doctor.isAcceptingPatients && styles.consultBtnDisabled]}
          disabled={!doctor.isAcceptingPatients}
          onPress={() => navigation.navigate('NewConsultation', { doctorId: doctor.id })}
        >
          <MessageCircle size={20} color={Colors.white} />
          <Text style={styles.consultBtnText}>
            {language === 'ar' ? 'طلب استشارة فورية مع الطبيب' : 'Consult Online with Doctor'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: Colors.white,
    fontWeight: '700',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  doctorHeaderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  doctorName: {
    fontSize: 19,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b45309',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '700',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  closedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.emergency,
    flex: 1,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  portfolioItem: {
    marginBottom: 16,
  },
  caseTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  slider: {
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
  },
  caseDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadows.md,
  },
  callBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  consultBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    ...Shadows.sm,
  },
  consultBtnDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.6,
  },
  consultBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
