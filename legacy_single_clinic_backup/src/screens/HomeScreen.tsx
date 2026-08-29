import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import {
  Stethoscope,
  Calendar,
  Phone,
  MessageSquare,
  MapPin,
  Star,
  Award,
  Users,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Globe,
  UserCheck,
} from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { CLINIC_INFO, DEFAULT_SERVICES } from '../constants/dentalData';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { SkeletonServiceCard } from '../components/SkeletonCard';

interface HomeScreenProps {
  navigation: any;
}

const blurhash = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const {
    language,
    setLanguage,
    role,
    setRole,
    t,
    isRTL,
    clinicSettings,
    services,
    portfolioCases,
    refreshClinicData,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshClinicData().catch((e) => console.warn('HomeScreen focus refresh error:', e));
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshClinicData();
    } catch (e) {
      console.warn('HomeScreen onRefresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCall = () => {
    const phone = clinicSettings?.phoneNumber || CLINIC_INFO.phone;
    Linking.openURL(`tel:${phone}`).catch(console.warn);
  };

  const handleWhatsApp = () => {
    const phone = clinicSettings?.whatsappNumber || CLINIC_INFO.whatsapp;
    const text = encodeURIComponent(
      language === 'ar'
        ? 'مرحباً د. كريم، أود الاستفسار بخصوص استشارة بالعيادة.'
        : 'Hello Dr. Karim, I would like to inquire about a clinic consultation.'
    );
    Linking.openURL(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`).catch(console.warn);
  };

  const handleMap = () => {
    if (clinicSettings?.locationMapsUrl) {
      Linking.openURL(clinicSettings.locationMapsUrl).catch(console.warn);
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${CLINIC_INFO.mapLatitude},${CLINIC_INFO.mapLongitude}`;
      Linking.openURL(url).catch(console.warn);
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
      {/* Top Language Switcher Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.langButton}
          onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        >
          <Globe size={14} color={Colors.primaryDark} />
          <Text style={styles.langButtonText}>
            {language === 'ar' ? '🌐 English' : '🌐 العربية'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Doctor Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeaderCentered}>
          <View style={styles.doctorAvatarContainer}>
            {clinicSettings?.avatarUrl ? (
              <Image
                source={{ uri: clinicSettings.avatarUrl }}
                style={styles.doctorAvatar}
                contentFit="cover"
                placeholder={blurhash}
                cachePolicy="memory-disk"
              />
            ) : (
              <Image
                source={require('../../assets/doctor_clinic.jpg')}
                style={styles.doctorAvatar}
                contentFit="cover"
                placeholder={blurhash}
                cachePolicy="memory-disk"
              />
            )}
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={14} color={Colors.white} />
            </View>
          </View>

          <View style={styles.heroTextContainerCentered}>
            <Text style={styles.doctorName}>
              {clinicSettings?.doctorName || (language === 'ar' ? CLINIC_INFO.doctorNameAr : CLINIC_INFO.doctorNameEn)}
            </Text>
            <Text style={styles.doctorTitle}>
              {clinicSettings?.doctorTitle || (language === 'ar' ? CLINIC_INFO.doctorTitleAr : CLINIC_INFO.doctorTitleEn)}
            </Text>
            <View style={styles.ratingPill}>
              <Star size={14} color="#eab308" fill="#eab308" />
              <Text style={styles.ratingText}>{clinicSettings?.rating || CLINIC_INFO.rating}</Text>
              <Text style={styles.reviewCount}>({clinicSettings?.patientsCount || CLINIC_INFO.reviewCount}+ مريض)</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Award size={18} color={Colors.primary} />
            <Text style={styles.statNumber}>+{clinicSettings?.yearsExperience || 12}</Text>
            <Text style={styles.statLabel}>{t.yearsExperience}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Users size={18} color={Colors.secondary} />
            <Text style={styles.statNumber}>+{clinicSettings?.patientsCount || 3500}</Text>
            <Text style={styles.statLabel}>{t.satisfiedPatients}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Sparkles size={18} color="#eab308" />
            <Text style={styles.statNumber}>{clinicSettings?.rating || 4.9}/5</Text>
            <Text style={styles.statLabel}>{t.ratingScore}</Text>
          </View>
        </View>
      </View>

      {/* Main Action Banners */}
      <View style={styles.actionsSection}>
        {/* 1. Request Preliminary Diagnosis (Triage) */}
        <TouchableOpacity
          style={[
            styles.primaryActionCard,
            clinicSettings?.promoBadgeEnabled !== false && {
              borderColor: '#0284c7',
              borderWidth: 2,
              backgroundColor: '#f0f9ff',
              shadowColor: '#0284c7',
              shadowOpacity: 0.15,
              shadowRadius: 10,
            },
          ]}
          onPress={() => navigation.navigate('NewConsultation')}
          activeOpacity={0.85}
        >
          {/* Floating Ribbon Badge (Concept 1) */}
          {clinicSettings?.promoBadgeEnabled !== false && (
            <View
style={[styles.promoBadge, isRTL ? styles.left16 : styles.right16]}
            >
              <Sparkles size={11} color={Colors.white} />
              <Text
style={styles.promoBadgeText}
              >
                {(!clinicSettings?.promoBadgeText || clinicSettings.promoBadgeText === '✨ مجاناً لفترة محدودة' || clinicSettings.promoBadgeText === '✨ Free for a limited time')
                  ? t.promoBadgeDefault
                  : clinicSettings.promoBadgeText}
              </Text>
            </View>
          )}

          <View style={styles.actionIconBubble}>
            <Stethoscope size={28} color={Colors.white} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>{t.startConsultation}</Text>
            <Text style={styles.actionSubtitle}>{t.startConsultationSub}</Text>
          </View>
          <View style={styles.actionArrow}>
            <ChevronRight
              size={20}
              color={Colors.primary}
              style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
            />
          </View>
        </TouchableOpacity>

        {/* 2. Direct Medical Chat */}
        <TouchableOpacity
          style={[
            styles.chatActionCard,
            clinicSettings?.promoBadgeEnabled !== false && {
              borderColor: '#0284c7',
              borderWidth: 2,
              backgroundColor: '#f0f9ff',
              shadowColor: '#0284c7',
              shadowOpacity: 0.15,
              shadowRadius: 10,
            },
          ]}
          onPress={() => navigation.navigate('Chat')}
          activeOpacity={0.85}
        >
          {/* Floating Ribbon Badge for Chat (Concept 1) */}
          {clinicSettings?.promoBadgeEnabled !== false && (
            <View
style={[styles.chatPromoBadge, isRTL ? styles.left16 : styles.right16]}
            >
              <Sparkles size={11} color={Colors.white} />
              <Text
style={styles.promoBadgeText}
              >
                {(!clinicSettings?.promoBadgeText || clinicSettings.promoBadgeText === '✨ مجاناً لفترة محدودة' || clinicSettings.promoBadgeText === '✨ Free for a limited time')
                  ? t.promoBadgeDefault
                  : clinicSettings.promoBadgeText}
              </Text>
            </View>
          )}

          <View style={styles.chatIconBubble}>
            <MessageSquare size={24} color={Colors.white} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.chatActionTitle}>
              {language === 'ar' ? 'تواصل مباشرة مع الطبيب' : 'Chat with Doctor'}
            </Text>
            <Text style={styles.chatActionSubtitle}>
              {language === 'ar'
                ? 'استشارة فورية بالصوت والصور والأشعة'
                : 'Direct messaging with voice notes & photos'}
            </Text>
          </View>
          <View style={styles.actionArrow}>
            <ChevronRight
              size={20}
              color="#0284c7"
              style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
            />
          </View>
        </TouchableOpacity>

        {/* Quick Contact Row */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate('Chat')}
          >
            <MessageSquare size={18} color={Colors.primary} />
            <Text style={styles.quickBtnText}>{language === 'ar' ? 'محادثة الطبيب' : 'Chat'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickBtn} onPress={handleCall}>
            <Phone size={18} color={Colors.secondary} />
            <Text style={styles.quickBtnText}>{t.callDoctor}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickBtn} onPress={handleWhatsApp}>
            <MessageSquare size={18} color="#25D366" />
            <Text style={styles.quickBtnText}>{t.whatsapp}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Services Grid (Dynamic) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t.ourServices}</Text>
      </View>

      <View style={styles.servicesGrid}>
        {refreshing && services.length === 0 ? (
          <>
            <SkeletonServiceCard />
            <SkeletonServiceCard />
            <SkeletonServiceCard />
            <SkeletonServiceCard />
          </>
        ) : (
          (services.length > 0 ? services : DEFAULT_SERVICES).map((service: any) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceCard}
            onPress={() =>
              navigation.navigate('NewConsultation')
            }
          >
            <View style={styles.serviceIconContainer}>
              <Sparkles size={20} color={Colors.primary} />
            </View>
            <Text style={styles.serviceName}>
              {language === 'ar' ? service.nameAr : service.nameEn}
            </Text>
            <Text style={styles.serviceDesc} numberOfLines={2}>
              {language === 'ar' ? service.descriptionAr : service.descriptionEn}
            </Text>
            <View style={styles.serviceFooter}>
              <Text style={styles.servicePrice}>
                {service.estimatedPrice} {t.egp}
              </Text>
              <Text style={styles.serviceDuration}>
                {service.durationMinutes} {t.minutes}
              </Text>
            </View>
          </TouchableOpacity>
        ))
        )}
      </View>

      {/* Smile Makeover Before & After Gallery (Dynamic) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t.smileGallery}</Text>
      </View>

      <View style={styles.galleryContainer}>
        {refreshing && portfolioCases.length === 0 ? (
          <SkeletonServiceCard />
        ) : (
          portfolioCases.map((item: any) => (
          <BeforeAfterSlider key={item.id} item={item} />
        ))
        )}
      </View>

      {/* About Dr. Karim Section with Dynamic Cover Photo */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {language === 'ar'
            ? `عن ${clinicSettings?.doctorName || 'د. كريم أبو بكر'}`
            : `About ${clinicSettings?.doctorName || 'Dr. Karim Abo Bakr'}`}
        </Text>
      </View>

      <View style={styles.doctorBioCard}>
        <View style={styles.doctorBioImageContainer}>
          {clinicSettings?.coverImageUrl ? (
            <Image
              source={{ uri: clinicSettings.coverImageUrl }}
              style={styles.doctorBioImage}
              contentFit="cover"
                placeholder={blurhash}
                cachePolicy="memory-disk"
            />
          ) : (
            <Image
              source={require('../../assets/doctor_formal.jpg')}
              style={styles.doctorBioImage}
              contentFit="cover"
                placeholder={blurhash}
                cachePolicy="memory-disk"
            />
          )}
          <View style={styles.doctorBioVerifiedBadge}>
            <ShieldCheck size={14} color={Colors.white} />
          </View>
        </View>

        <View style={styles.doctorBioOverlay}>
          <Text style={styles.doctorBioName}>
            {clinicSettings?.doctorName || (language === 'ar' ? 'د. كريم أبو بكر' : 'Dr. Karim Abo Bakr')}
          </Text>
          <View style={styles.doctorBioDegreeBadge}>
            <Text style={styles.doctorBioDegree}>
              {clinicSettings?.doctorTitle ||
                (language === 'ar'
                  ? 'استشاري طب وجراحة وتجميل وزراعة الأسنان'
                  : 'Consultant in Dental Surgery, Cosmetics & Implants')}
            </Text>
          </View>
          <Text style={styles.doctorBioDesc}>
            {clinicSettings?.doctorBio ||
              (language === 'ar'
                ? 'تقديم أحدث الحلول العلاجية والتجميلية وزراعة الأسنان بأعلى معايير التعقيم العالمية وأحدث التقنيات الرقمية المتقدمة.'
                : 'Dedicated to delivering state-of-the-art cosmetic dentistry, dental implants, and advanced clinical care.')}
          </Text>
        </View>
      </View>

      {/* Clinic Info Card */}
      <View style={styles.clinicInfoCard}>
        <Text style={styles.clinicName}>
          {language === 'ar' ? CLINIC_INFO.nameAr : CLINIC_INFO.nameEn}
        </Text>
        <TouchableOpacity style={styles.infoRow} onPress={handleMap}>
          <MapPin size={16} color={Colors.primary} />
          <Text style={styles.infoText}>
            {clinicSettings?.locationAddress || (language === 'ar' ? CLINIC_INFO.addressAr : CLINIC_INFO.addressEn)}
          </Text>
        </TouchableOpacity>
        <View style={styles.infoRow}>
          <Calendar size={16} color={Colors.secondary} />
          <Text style={styles.infoText}>
            {clinicSettings?.workingHours || (language === 'ar' ? CLINIC_INFO.workingHoursAr : CLINIC_INFO.workingHoursEn)}
          </Text>
        </View>
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
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  langButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
    marginBottom: 16,
  },
  heroHeaderCentered: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  doctorAvatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  doctorAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3.5,
    borderColor: Colors.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 3,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  heroTextContainerCentered: {
    alignItems: 'center',
    width: '100%',
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  doctorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef9c3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fde047',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#854d0e',
  },
  reviewCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854d0e',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 16,
  },
  primaryActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    ...Shadows.sm,
  },
  secondaryActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondaryLight,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    ...Shadows.sm,
  },
  chatActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    ...Shadows.sm,
  },
  chatIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatActionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0369a1',
    marginBottom: 2,
  },
  chatActionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    ...Shadows.sm,
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  actionIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconBubbleTeal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 2,
  },
  actionTitleTeal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.secondary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  actionArrow: {
    padding: 4,
  },
  contactBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  contactBtnPhone: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  contactBtnWhatsapp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  contactBtnMap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
  },
  contactBtnTextWhite: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  contactBtnTextDark: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  serviceCard: {
    width: '48.5%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  serviceIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    marginBottom: 8,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 6,
  },
  servicePrice: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  serviceDuration: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  galleryContainer: {
    marginBottom: 20,
  },
  doctorBioCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    ...Shadows.md,
  },
  doctorBioImageContainer: {
    position: 'relative',
    width: '100%',
    height: 290,
    backgroundColor: '#0f172a',
  },
  doctorBioImage: {
    width: '100%',
    height: '100%',
  },
  doctorBioVerifiedBadge: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 5,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  doctorBioOverlay: {
    alignItems: 'center',
    width: '100%',
    padding: 18,
  },
  doctorBioName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  doctorBioDegreeBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  doctorBioDegree: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  doctorBioDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
  clinicInfoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    ...Shadows.sm,
  },
  clinicName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },

  promoBadge: {
    position: 'absolute',
    top: -11,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  chatPromoBadge: {
    position: 'absolute',
    top: -11,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  promoBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  left16: { left: 16 },
  right16: { right: 16 },
});
