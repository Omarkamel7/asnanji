import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Sparkles,
  MapPin,
  DollarSign,
  AlertCircle,
} from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { DEFAULT_SERVICES, CLINIC_INFO } from '../constants/dentalData';
import { DentalService } from '../types';

interface AppointmentsScreenProps {
  route?: any;
  navigation: any;
}

export const AppointmentsScreen: React.FC<AppointmentsScreenProps> = ({
  route,
  navigation,
}) => {
  const {
    t,
    language,
    currentUser,
    appointments,
    bookAppointment,
    cancelAppointment,
    services,
    refreshClinicData,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshClinicData().catch((e) => console.warn('Appointments focus refresh error:', e));
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshClinicData();
    } catch (e) {
      console.warn('Appointments onRefresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const activeServices = services.length > 0 ? services : DEFAULT_SERVICES;
  const preselectedServiceId = route?.params?.selectedServiceId;

  const [selectedService, setSelectedService] = useState<DentalService>(
    activeServices.find((s) => s.id === preselectedServiceId) ||
      activeServices[0]
  );

  // Dates generator (Next 7 available days excluding Friday)
  const availableDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + (i + 1));
    return d;
  });

  const [selectedDate, setSelectedDate] = useState<Date>(availableDates[0]);

  const TIME_SLOTS = [
    '12:30 - 13:00',
    '14:00 - 14:30',
    '15:30 - 16:00',
    '17:00 - 17:30',
    '18:00 - 18:30',
    '19:00 - 19:30',
    '20:00 - 20:30',
    '21:00 - 21:30',
  ];

  const [selectedSlot, setSelectedSlot] = useState<string>(TIME_SLOTS[4]);
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      await bookAppointment({
        patientId: currentUser.id,
        patientName: currentUser.fullName,
        patientPhone: currentUser.phone,
        serviceId: selectedService.id,
        serviceNameAr: selectedService.nameAr,
        serviceNameEn: selectedService.nameEn,
        date: dateStr,
        timeSlot: selectedSlot,
        price: selectedService.estimatedPrice,
      });

      Alert.alert(
        language === 'ar' ? 'تم تأكيد الحجز' : 'Appointment Confirmed',
        language === 'ar'
          ? `تم حجز موعدك بنجاح يوم ${dateStr} في تمام ${selectedSlot} بعيادة د. كريم أبو بكر.`
          : `Appointment booked on ${dateStr} at ${selectedSlot}.`,
        [
          {
            text: language === 'ar' ? 'عرض حجوزاتي' : 'View Appointments',
            onPress: () => {},
          },
        ]
      );
    } catch (e) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'تعذر إتمام الحجز' : 'Failed to book appointment'
      );
    } finally {
      setLoading(false);
    }
  };

  const myAppointments = appointments.filter(
    (a) => a.patientId === currentUser.id
  );

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
      {/* 1. Select Service */}
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>{t.selectService}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.servicesScroll}
        >
          {activeServices.map((srv) => {
            const isSelected = selectedService.id === srv.id;
            return (
              <TouchableOpacity
                key={srv.id}
                onPress={() => setSelectedService(srv)}
                style={[
                  styles.serviceChip,
                  isSelected && styles.serviceChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.serviceChipTitle,
                    isSelected && styles.serviceChipTitleSelected,
                  ]}
                >
                  {language === 'ar' ? srv.nameAr : srv.nameEn}
                </Text>
                <Text
                  style={[
                    styles.serviceChipPrice,
                    isSelected && styles.serviceChipPriceSelected,
                  ]}
                >
                  {srv.estimatedPrice} {t.egp}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. Select Date */}
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>{t.selectDate}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datesScroll}
        >
          {availableDates.map((date, idx) => {
            const isSelected =
              date.toDateString() === selectedDate.toDateString();
            const dayName = date.toLocaleDateString(
              language === 'ar' ? 'ar-EG' : 'en-US',
              { weekday: 'short' }
            );
            const dayNum = date.getDate();
            const monthName = date.toLocaleDateString(
              language === 'ar' ? 'ar-EG' : 'en-US',
              { month: 'short' }
            );

            return (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedDate(date)}
                style={[styles.dateCard, isSelected && styles.dateCardSelected]}
              >
                <Text
                  style={[
                    styles.dayName,
                    isSelected && styles.dayNameSelected,
                  ]}
                >
                  {dayName}
                </Text>
                <Text
                  style={[
                    styles.dayNum,
                    isSelected && styles.dayNumSelected,
                  ]}
                >
                  {dayNum}
                </Text>
                <Text
                  style={[
                    styles.monthName,
                    isSelected && styles.monthNameSelected,
                  ]}
                >
                  {monthName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Select Time Slot */}
      <View style={styles.sectionBox}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.sectionTitle}>{t.selectTimeSlot}</Text>
          <Text style={{ fontSize: 11, color: Colors.textMuted }}>
            {language === 'ar' ? 'المواعيد المتاحة للعيادة' : 'Available Clinic Slots'}
          </Text>
        </View>
        <View style={styles.slotsGrid}>
          {TIME_SLOTS.map((slot) => {
            const dateStr = selectedDate.toISOString().split('T')[0];
            const isBooked = appointments.some(
              (a) => a.date === dateStr && a.timeSlot === slot && a.status !== 'cancelled'
            );
            const isSelected = selectedSlot === slot && !isBooked;

            return (
              <TouchableOpacity
                key={slot}
                disabled={isBooked}
                onPress={() => setSelectedSlot(slot)}
                style={[
                  styles.slotBtn,
                  isSelected && styles.slotBtnSelected,
                  isBooked && styles.slotBtnBooked,
                ]}
              >
                <Clock
                  size={14}
                  color={
                    isBooked
                      ? '#94a3b8'
                      : isSelected
                      ? Colors.white
                      : Colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.slotText,
                    isSelected && styles.slotTextSelected,
                    isBooked && styles.slotTextBooked,
                  ]}
                >
                  {slot}
                </Text>
                {isBooked && (
                  <View style={styles.bookedTag}>
                    <Text style={styles.bookedTagText}>
                      {language === 'ar' ? 'محجوز' : 'Booked'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Booking Summary & Confirm Button */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t.appointmentService}:</Text>
          <Text style={styles.summaryValue}>
            {language === 'ar' ? selectedService.nameAr : selectedService.nameEn}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t.appointmentDate}:</Text>
          <Text style={styles.summaryValue}>
            {selectedDate.toISOString().split('T')[0]} ({selectedSlot})
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            {language === 'ar' ? 'التكلفة المقدرة:' : 'Estimated Cost:'}
          </Text>
          <Text style={styles.summaryPrice}>
            {selectedService.estimatedPrice} {t.egp} (الدفع في العيادة)
          </Text>
        </View>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleBook}
          disabled={loading}
        >
          <CheckCircle size={20} color={Colors.white} />
          <Text style={styles.confirmButtonText}>{t.confirmBooking}</Text>
        </TouchableOpacity>
      </View>

      {/* My Existing Scheduled Appointments */}
      <View style={styles.sectionHeader}>
        <Text style={styles.headerTitle}>{t.myAppointments}</Text>
      </View>

      {myAppointments.length === 0 ? (
        <View style={styles.emptyCard}>
          <CalendarIcon size={36} color={Colors.textMuted} />
          <Text style={styles.emptyText}>{t.noAppointments}</Text>
        </View>
      ) : (
        myAppointments.map((apt) => (
          <View key={apt.id} style={styles.myAptCard}>
            <View style={styles.myAptHeader}>
              <Text style={styles.myAptService}>
                {language === 'ar' ? apt.serviceNameAr : apt.serviceNameEn}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      apt.status === 'confirmed'
                        ? Colors.routineBg
                        : Colors.emergencyBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        apt.status === 'confirmed'
                          ? Colors.routine
                          : Colors.emergency,
                    },
                  ]}
                >
                  {apt.status === 'confirmed'
                    ? language === 'ar'
                      ? 'مؤكد'
                      : 'Confirmed'
                    : language === 'ar'
                    ? 'ملغي'
                    : 'Cancelled'}
                </Text>
              </View>
            </View>

            <View style={styles.myAptDetails}>
              <View style={styles.aptDetailRow}>
                <CalendarIcon size={14} color={Colors.primary} />
                <Text style={styles.aptDetailText}>{apt.date}</Text>
              </View>
              <View style={styles.aptDetailRow}>
                <Clock size={14} color={Colors.secondary} />
                <Text style={styles.aptDetailText}>{apt.timeSlot}</Text>
              </View>
              <View style={styles.aptDetailRow}>
                <MapPin size={14} color={Colors.textSecondary} />
                <Text style={styles.aptDetailText}>
                  {language === 'ar'
                    ? CLINIC_INFO.addressAr
                    : CLINIC_INFO.addressEn}
                </Text>
              </View>
            </View>

            {apt.status === 'confirmed' && (
              <TouchableOpacity
                onPress={() => cancelAppointment(apt.id)}
                style={styles.cancelBtn}
              >
                <XCircle size={14} color={Colors.emergency} />
                <Text style={styles.cancelBtnText}>{t.cancelAppointment}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sectionBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  servicesScroll: {
    gap: 8,
  },
  serviceChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 130,
  },
  serviceChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  serviceChipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  serviceChipTitleSelected: {
    color: Colors.primaryDark,
  },
  serviceChipPrice: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  serviceChipPriceSelected: {
    color: Colors.primary,
    fontWeight: '800',
  },
  datesScroll: {
    gap: 8,
  },
  dateCard: {
    width: 68,
    height: 78,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
    ...Shadows.sm,
  },
  dayName: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  dayNameSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  dayNumSelected: {
    color: Colors.white,
  },
  monthName: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  monthNameSelected: {
    color: 'rgba(255,255,255,0.85)',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    width: '48%',
    justifyContent: 'center',
  },
  slotBtnSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  slotBtnBooked: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    opacity: 0.65,
  },
  slotText: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  slotTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  slotTextBooked: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  bookedTag: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  bookedTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#dc2626',
  },
  summaryCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: 20,
    gap: 8,
    ...Shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  summaryPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
    gap: 8,
    ...Shadows.sm,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  myAptCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    ...Shadows.sm,
  },
  myAptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  myAptService: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  myAptDetails: {
    gap: 4,
    marginBottom: 8,
  },
  aptDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aptDetailText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 4,
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 11,
    color: Colors.emergency,
    fontWeight: '700',
  },
});
