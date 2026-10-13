import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import {
  Calendar,
  Clock,
  Phone,
  MessageCircle,
  User,
  CheckCircle,
  UserCheck,
  AlertCircle,
  LogOut,
  Plus,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { Appointment } from '../../types';

export const AssistantScheduleScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    appointments,
    updateAppointmentStatus,
    currentUser,
    signOut,
    language,
  } = useApp();

  const isRTL = language === 'ar';
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredAppointments = appointments.filter((app) => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const handleCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone: string) => {
    if (!phone) return;
    const clean = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`whatsapp://send?phone=${clean}`);
  };

  const handleStatusChange = (appId: string, newStatus: Appointment['status'], patientName: string) => {
    const statusLabels: Record<string, string> = {
      confirmed: isRTL ? 'تأكيد الحضور' : 'Confirmed',
      completed: isRTL ? 'إتمام الزيارة' : 'Completed',
      cancelled: isRTL ? 'إلغاء الموعد' : 'Cancelled',
    };

    Alert.alert(
      isRTL ? 'تحديث حالة الموعد' : 'Update Appointment',
      isRTL
        ? `هل تريد تغيير حالة موعد ${patientName} إلى: ${statusLabels[newStatus]}؟`
        : `Change status for ${patientName} to ${statusLabels[newStatus]}?`,
      [
        { text: isRTL ? 'تراجع' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'تأكيد' : 'Confirm',
          onPress: async () => {
            await updateAppointmentStatus(appId, newStatus);
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      isRTL ? 'تسجيل الخروج' : 'Sign Out',
      isRTL ? 'هل تريد تسجيل الخروج من حساب سكرتارية العيادة؟' : 'Sign out from assistant account?',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'تسجيل الخروج' : 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Banner */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>
                {isRTL ? 'جدول مواعيد العيادة' : 'Clinic Reception Schedule'}
              </Text>
              <Text style={styles.headerSub}>
                {isRTL
                  ? `مرحباً ${currentUser?.fullName || 'سكرتارية العيادة'} • إدارة طابور المرضى`
                  : `Welcome ${currentUser?.fullName || 'Assistant'} • Patient Queue`}
              </Text>
            </View>

            <TouchableOpacity style={styles.signOutIconBtn} onPress={handleSignOut}>
              <LogOut size={18} color="#dc2626" />
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterBar}>
            {(['all', 'confirmed', 'completed', 'cancelled'] as const).map((tab) => {
              const count =
                tab === 'all'
                  ? appointments.length
                  : appointments.filter((a) => a.status === tab).length;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.filterPill, filter === tab && styles.filterPillActive]}
                  onPress={() => setFilter(tab)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      filter === tab && styles.filterPillTextActive,
                    ]}
                  >
                    {tab === 'all'
                      ? isRTL ? 'الكل' : 'All'
                      : tab === 'confirmed'
                      ? isRTL ? 'مؤكد' : 'Confirmed'
                      : tab === 'completed'
                      ? isRTL ? 'مكتمل' : 'Completed'
                      : isRTL ? 'ملغي' : 'Cancelled'}
                    {` (${count})`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Appointment List */}
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Calendar size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>
                {isRTL ? 'لا توجد مواعيد في هذا القسم' : 'No appointments scheduled'}
              </Text>
              <Text style={styles.emptySub}>
                {isRTL ? 'جميع المواعيد المحجوزة ستظهر هنا.' : 'Booked appointments will appear here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.appointmentCard}>
              <View style={styles.cardHeader}>
                <View style={styles.patientAvatarBox}>
                  <User size={20} color={Colors.primary} />
                </View>
                <View style={styles.patientInfoBox}>
                  <Text style={styles.patientName}>{item.patientName}</Text>
                  <Text style={styles.appointmentService}>
                    {(isRTL ? item.serviceNameAr : item.serviceNameEn) || (isRTL ? 'كشف واستشارة أسنان' : 'Dental Consultation')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'confirmed'
                      ? styles.badgeConfirmed
                      : item.status === 'completed'
                      ? styles.badgeCompleted
                      : styles.badgeCancelled,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.status === 'confirmed'
                        ? styles.badgeTextConfirmed
                        : item.status === 'completed'
                        ? styles.badgeTextCompleted
                        : styles.badgeTextCancelled,
                    ]}
                  >
                    {item.status === 'confirmed'
                      ? isRTL ? 'مؤكد' : 'Confirmed'
                      : item.status === 'completed'
                      ? isRTL ? 'مكتمل' : 'Completed'
                      : isRTL ? 'ملغي' : 'Cancelled'}
                  </Text>
                </View>
              </View>

              <View style={styles.timeInfoRow}>
                <View style={styles.timeBox}>
                  <Calendar size={14} color={Colors.textSecondary} />
                  <Text style={styles.timeText}>{item.date}</Text>
                </View>
                <View style={styles.timeBox}>
                  <Clock size={14} color={Colors.textSecondary} />
                  <Text style={styles.timeText}>{item.timeSlot}</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              {/* Action Buttons */}
              <View style={styles.cardActionsRow}>
                {item.patientPhone ? (
                  <>
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => handleCall(item.patientPhone)}
                    >
                      <Phone size={14} color={Colors.primary} />
                      <Text style={styles.contactBtnText}>{isRTL ? 'اتصال' : 'Call'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.contactBtn, { backgroundColor: '#f0fdf4' }]}
                      onPress={() => handleWhatsApp(item.patientPhone)}
                    >
                      <MessageCircle size={14} color="#16a34a" />
                      <Text style={[styles.contactBtnText, { color: '#16a34a' }]}>
                        واتساب
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : null}

                {item.status === 'confirmed' && (
                  <TouchableOpacity
                    style={[styles.statusBtn, { backgroundColor: '#dcfce7' }]}
                    onPress={() => handleStatusChange(item.id, 'completed', item.patientName)}
                  >
                    <CheckCircle size={14} color="#16a34a" />
                    <Text style={[styles.statusBtnText, { color: '#16a34a' }]}>
                      {isRTL ? 'تم الكشف' : 'Complete'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  signOutIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterPillActive: {
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    fontWeight: '800',
    color: Colors.primary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 14,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  appointmentCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  patientAvatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f0fdfa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientInfoBox: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  appointmentService: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeConfirmed: {
    backgroundColor: '#dcfce7',
  },
  badgeCompleted: {
    backgroundColor: '#f1f5f9',
  },
  badgeCancelled: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextConfirmed: {
    color: '#16a34a',
  },
  badgeTextCompleted: {
    color: '#64748b',
  },
  badgeTextCancelled: {
    color: '#dc2626',
  },
  timeInfoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
