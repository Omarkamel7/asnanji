import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Switch, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Save } from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../services/supabase';

export const DoctorSettingsScreen = () => {
  const navigation = useNavigation();
  const { currentUser } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [bio, setBio] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [consultationFee, setConsultationFee] = useState('0');
  const [isAcceptingPatients, setIsAcceptingPatients] = useState(true);
  
  const [enableInstantConsultation, setEnableInstantConsultation] = useState(true);
  const [enableBooking, setEnableBooking] = useState(true);
  const [enableChat, setEnableChat] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: profileData } = await supabase.from('doctor_profiles').select('*').eq('id', currentUser.id).single();
    if (profileData) {
      setBio(profileData.bio || '');
      setSpecialty(profileData.specialty || '');
      setClinicAddress(profileData.clinic_address || '');
      setConsultationFee(profileData.consultation_fee?.toString() || '0');
      setIsAcceptingPatients(profileData.is_accepting_patients);
    }
    const { data: settingsData } = await supabase.from('doctor_settings').select('*').eq('doctor_id', currentUser.id).single();
    if (settingsData) {
      setEnableInstantConsultation(settingsData.enable_instant_consultation);
      setEnableBooking(settingsData.enable_booking);
      setEnableChat(settingsData.enable_chat);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    const profileUpdates = {
      id: currentUser.id,
      slug: currentUser.id,
      bio,
      specialty,
      clinic_address: clinicAddress,
      consultation_fee: Number(consultationFee),
      is_accepting_patients: isAcceptingPatients,
      updated_at: new Date().toISOString()
    };
    const { error: profileError } = await supabase.from('doctor_profiles').upsert(profileUpdates);
    
    const settingsUpdates = {
      doctor_id: currentUser.id,
      enable_instant_consultation: enableInstantConsultation,
      enable_booking: enableBooking,
      enable_chat: enableChat,
    };
    const { error: settingsError } = await supabase.from('doctor_settings').upsert(settingsUpdates);
    
    setSaving(false);
    
    if (profileError || settingsError) {
      Alert.alert('Error', (profileError?.message || '') + ' ' + (settingsError?.message || ''));
    } else {
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile Settings</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color={Colors.primary} /> : <Save color={Colors.primary} />}
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Specialty</Text>
          <TextInput style={styles.input} value={specialty} onChangeText={setSpecialty} placeholder="e.g. Endodontist" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput style={[styles.input, { height: 100 }]} multiline value={bio} onChangeText={setBio} placeholder="About you..." />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Clinic Address</Text>
          <TextInput style={styles.input} value={clinicAddress} onChangeText={setClinicAddress} placeholder="123 Street" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Consultation Fee ($)</Text>
          <TextInput style={styles.input} value={consultationFee} onChangeText={setConsultationFee} keyboardType="numeric" />
        </View>
        <View style={styles.switchGroup}>
          <Text style={styles.label}>Vacation Mode (Offline)</Text>
          <Switch value={!isAcceptingPatients} onValueChange={(val) => setIsAcceptingPatients(!val)} trackColor={{ true: Colors.error }} />
        </View>
        <View style={styles.switchGroup}>
          <Text style={styles.label}>Enable Instant Consultation</Text>
          <Switch value={enableInstantConsultation} onValueChange={setEnableInstantConsultation} trackColor={{ true: Colors.primary }} />
        </View>
        <View style={styles.switchGroup}>
          <Text style={styles.label}>Enable Bookings</Text>
          <Switch value={enableBooking} onValueChange={setEnableBooking} trackColor={{ true: Colors.primary }} />
        </View>
        <View style={styles.switchGroup}>
          <Text style={styles.label}>Enable Chat</Text>
          <Switch value={enableChat} onValueChange={setEnableChat} trackColor={{ true: Colors.primary }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, backgroundColor: Colors.surface, ...Shadows.sm },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8, color: Colors.textSecondary },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, fontSize: 15 },
  switchGroup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, padding: 16, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border }
});
