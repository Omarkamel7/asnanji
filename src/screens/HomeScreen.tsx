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
  ChevronLeft,
  Clock,
} from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { DoctorAvatar } from '../components/DoctorAvatar';

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
    appointments,
    currentUser,
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

  const upcomingAppointment = useMemo(() => {
    return appointments.find(
      (a) => a.patientId === currentUser.id && a.status !== 'cancelled'
    );
  }, [appointments, currentUser.id]);

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
        {filteredDoctors.map(doctor => (
          <TouchableOpacity 
            key={doctor.id} 
            style={styles.doctorCard}
            onPress={() => navigation.navigate('DoctorPublicProfile', { doctorId: doctor.id })}
          >
            <View style={styles.doctorHeader}>
              <DoctorAvatar
                avatarUrl={doctor.avatarUrl}
                name={doctor.profileData?.fullName}
                size={60}
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
            {/* Direct Quick Action Buttons */}
            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                style={styles.cardConsultBtn}
                onPress={() => navigation.navigate('NewConsultation', {
                  doctorId: doctor.id,
                  doctorName: doctor.profileData?.fullName,
                  doctorSpecialty: doctor.specialty,
                })}
              >
                <Stethoscope size={15} color={Colors.white} />
                <Text style={styles.cardConsultBtnText}>
                  {language === 'ar' ? 'طلب استشارة' : 'Consult Online'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cardBookBtn}
                onPress={() => navigation.navigate('DoctorPublicProfile', { doctorId: doctor.id })}
              >
                <Calendar size={15} color={Colors.primary} />
                <Text style={styles.cardBookBtnText}>
                  {language === 'ar' ? 'حجز موعد' : 'Book Visit'}
                </Text>
              </TouchableOpacity>
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
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cardConsultBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  cardConsultBtnText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 13,
  },
  cardBookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  cardBookBtnText: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 13,
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
  upcomingAppointmentCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.sm,
  },
  upcomingAptIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  upcomingBadgeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },
  upcomingStatusBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  upcomingDoctorText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  upcomingTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyDoctorsCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 4,
    ...Shadows.sm,
  },
  emptyDoctorsIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyDoctorsTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDoctorsSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  joinAsDoctorBtn: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    ...Shadows.sm,
  },
  joinAsDoctorBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  heroActionBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
});


