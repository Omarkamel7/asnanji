import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import {
  Search,
  MapPin,
  Star,
  Globe,
  Sparkles,
  Stethoscope,
  Calendar,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';

interface HomeScreenProps {
  navigation: any;
}

const blurhash = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const {
    language,
    setLanguage,
    t,
    doctors,
    refreshClinicData,
    isRTL,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

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

  const specialties = useMemo(() => {
    const specs = new Set<string>();
    doctors.forEach(d => {
      if (d.specialty) specs.add(d.specialty);
    });
    return Array.from(specs);
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const matchesSearch = doc.profileData?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            doc.specialty?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecialty = selectedSpecialty ? doc.specialty === selectedSpecialty : true;
      return matchesSearch && matchesSpecialty;
    });
  }, [doctors, searchQuery, selectedSpecialty]);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/app_logo.png')}
            style={styles.brandLogo}
            contentFit="contain"
          />
          <View>
            <Text style={styles.headerTitle}>{t.appTitle}</Text>
            <Text style={styles.headerSubtitle}>
              {language === 'ar' ? 'احجز موعدك • استشر طبيبك • ابتسم بثقة' : 'Book • Consult • Smile'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.langButton}
          onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        >
          <Globe size={14} color={Colors.primaryDark} />
          <Text style={styles.langButtonText}>
            {language === 'ar' ? 'EN' : 'AR'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textMuted} />
          <TextInput 
            style={styles.searchInput}
            placeholder={language === 'ar' ? "ابحث عن طبيب، التخصص، العيادة..." : "Search doctors, specialties..."}
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterPill, !selectedSpecialty && styles.filterPillActive]}
            onPress={() => setSelectedSpecialty(null)}
          >
            <Text style={[styles.filterPillText, !selectedSpecialty && styles.filterPillTextActive]}>{language === 'ar' ? "الكل" : "All"}</Text>
          </TouchableOpacity>
          {specialties.map(spec => (
            <TouchableOpacity 
              key={spec} 
              style={[styles.filterPill, selectedSpecialty === spec && styles.filterPillActive]}
              onPress={() => setSelectedSpecialty(spec)}
            >
              <Text style={[styles.filterPillText, selectedSpecialty === spec && styles.filterPillTextActive]}>{spec}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Animated Welcome Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Sparkles size={16} color="#0284c7" />
              <Text style={styles.heroBadge}>
                {language === 'ar' ? 'استشارة فورية بضغطة زر' : 'Instant Dental Consultation'}
              </Text>
            </View>
            <Text style={styles.heroTitle}>
              {language === 'ar' ? 'هل تشعر بألم في أسنانك؟ 🦷' : 'Experiencing tooth pain? 🦷'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {language === 'ar'
                ? 'حدد السن على المجسم 3D وأرسل الأعراض لتشخيص مبدئي من أفضل الأطباء'
                : 'Select tooth on 3D arch & get instant dental triage'}
            </Text>
            <TouchableOpacity
              style={styles.heroActionBtn}
              onPress={() => navigation.navigate('NewConsultation')}
            >
              <Text style={styles.heroActionBtnText}>
                {language === 'ar' ? 'ابدأ الاستشارة الآن 🩺' : 'Start Consultation 🩺'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {filteredDoctors.map(doctor => (
          <TouchableOpacity 
            key={doctor.id} 
            style={styles.doctorCard}
            onPress={() => navigation.navigate('DoctorPublicProfile', { doctorId: doctor.id })}
          >
            <View style={styles.doctorHeader}>
              <Image 
                source={doctor.avatarUrl ? { uri: doctor.avatarUrl } : require('../../assets/doctor_clinic.jpg')} 
                style={styles.doctorAvatar} 
                contentFit="cover"
                placeholder={blurhash}
              />
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{doctor.profileData?.fullName}</Text>
                <Text style={styles.doctorSpecialty}>{doctor.specialty || (language === 'ar' ? 'طبيب أسنان عام' : 'General Dentist')}</Text>
                <View style={styles.ratingRow}>
                  <Star size={14} color="#f59e0b" fill="#f59e0b" />
                  <Text style={styles.ratingText}>{doctor.rating.toFixed(1)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.doctorFooter}>
              <View style={styles.footerItem}>
                <MapPin size={14} color={Colors.textSecondary} />
                <Text style={styles.footerText} numberOfLines={1}>{doctor.clinicAddress || (language === 'ar' ? 'العنوان غير محدد' : 'Clinic Address Not Set')}</Text>
              </View>
              <View style={styles.priceTag}>
                <Text style={styles.priceText}>{language === 'ar' ? `يبدأ من ${doctor.consultationFee || 350} ج.م` : `From ${doctor.consultationFee || 350} EGP`}</Text>
              </View>
            </View>
            {!doctor.isAcceptingPatients && (
              <View style={styles.offlineBadge}>
                <Text style={styles.offlineText}>{language === 'ar' ? "غير متاح حالياً" : "Temporarily Closed"}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {filteredDoctors.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{language === 'ar' ? "لم يتم العثور على أطباء مطابقين" : "No doctors found."}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
    brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    width: 38,
    height: 38,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  filterScroll: {
    marginTop: 12,
  },
  filterContainer: {
    gap: 8,
    paddingRight: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: Colors.white,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  doctorCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.border,
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  doctorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  priceTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  offlineBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offlineText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: Colors.textMuted,
    fontSize: 15,
  },
  heroBanner: {
    backgroundColor: '#F0F9FF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    ...Shadows.sm,
  },
  heroBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 2,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  heroActionBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
    ...Shadows.sm,
  },
  heroActionBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
});


