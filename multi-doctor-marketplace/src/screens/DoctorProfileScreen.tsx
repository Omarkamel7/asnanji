import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, MapPin, Star, Phone, MessageCircle, Calendar } from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { DoctorProfile } from '../types/doctor';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { supabase } from '../services/supabase';

export const DoctorProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { doctorId } = route.params as { doctorId: string };
  const { doctors, currentUser } = useApp();

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
            .select('*, profiles:id(full_name)')
            .eq('id', doctorId)
            .single();
          if (data) {
            setDoctor({
              id: data.id,
              slug: data.slug,
              specialty: data.specialty,
              bio: data.bio,
              clinicAddress: data.clinic_address,
              consultationFee: data.consultation_fee,
              avatarUrl: data.avatar_url,
              isAcceptingPatients: data.is_accepting_patients,
              rating: Number(data.rating),
              profileData: {
                id: data.id,
                fullName: data.profiles?.full_name || 'Doctor',
                phone: '',
                role: 'doctor'
              }
            });
          }
        }
        
        const { data: portData } = await supabase
          .from('doctor_portfolio')
          .select('*')
          .eq('doctor_id', doctorId);
        
        if (portData) setPortfolio(portData);

      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [doctorId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Doctor not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={Colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <Image 
            source={doctor.avatarUrl ? { uri: doctor.avatarUrl } : require('../../assets/doctor_clinic.jpg')} 
            style={styles.avatar} 
            contentFit="cover"
          />
          <Text style={styles.name}>{doctor.profileData?.fullName}</Text>
          <Text style={styles.specialty}>{doctor.specialty || 'General Dentist'}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Star size={16} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.statValue}>{doctor.rating.toFixed(1)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}></Text>
              <Text style={styles.statLabel}>Starting Fee</Text>
            </View>
          </View>
        </View>

        {!doctor.isAcceptingPatients && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>Clinic Temporarily Closed</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{doctor.bio || 'No biography provided.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationRow}>
            <MapPin size={20} color={Colors.primary} />
            <Text style={styles.locationText}>{doctor.clinicAddress || 'Address not provided'}</Text>
          </View>
        </View>

        {portfolio.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio Showcase</Text>
            {portfolio.map(item => (
              <View key={item.id} style={styles.portfolioItem}>
                <Text style={styles.portfolioTitle}>{item.title}</Text>
                {item.description && <Text style={styles.portfolioDesc}>{item.description}</Text>}
                <View style={styles.sliderContainer}>
                  <BeforeAfterSlider item={{ id: item.id, title: item.title, description: item.description, beforeImageUrl: item.before_image_url, afterImageUrl: item.after_image_url, category: '' } as any} />
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.chatBtn, !doctor.isAcceptingPatients && styles.disabledBtn]}
          disabled={!doctor.isAcceptingPatients}
          onPress={() => navigation.navigate('NewConsultation', { doctorId: doctor.id })}
        >
          <MessageCircle size={20} color={Colors.white} />
          <Text style={styles.actionBtnText}>Consult Online</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...Shadows.sm,
    marginBottom: 16,
  },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  name: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary, marginBottom: 4 },
  specialty: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textMuted },
  statDivider: { width: 1, height: 24, backgroundColor: Colors.border },
  offlineBanner: {
    backgroundColor: Colors.error,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  offlineText: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Shadows.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  bioText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  locationText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  portfolioItem: { marginBottom: 20 },
  portfolioTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  portfolioDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  sliderContainer: { height: 200, borderRadius: 12, overflow: 'hidden' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    ...Shadows.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  chatBtn: { backgroundColor: Colors.primary },
  disabledBtn: { backgroundColor: Colors.textMuted },
  actionBtnText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
});



