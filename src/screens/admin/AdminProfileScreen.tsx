import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import {
  ShieldAlert,
  LogOut,
  Globe,
  Server,
  Layers,
  CheckCircle,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

export const AdminProfileScreen: React.FC = () => {
  const { currentUser, signOut, language, setLanguage } = useApp();
  const isRTL = language === 'ar';

  const handleSignOut = () => {
    Alert.alert(
      isRTL ? 'تسجيل الخروج' : 'Sign Out',
      isRTL
        ? 'هل أنت متأكد من رغبتك في تسجيل الخروج من لوحة تحكم الإدارة؟'
        : 'Are you sure you want to sign out from the Admin Portal?',
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.headerCard}>
          <View style={styles.avatarCircle}>
            <ShieldAlert size={36} color="white" />
          </View>
          <Text style={styles.adminName}>
            {currentUser?.fullName || (isRTL ? 'المدير العام للمنصة' : 'Super Administrator')}
          </Text>
          <Text style={styles.adminRole}>
            {isRTL ? 'مسؤول النظام الأعلى • أسنانجي' : 'Super Admin • Asnanji Platform'}
          </Text>
          <Text style={styles.adminEmail}>
            {currentUser?.email || 'admin@asnanji.com'}
          </Text>
        </View>

        {/* System & Architecture Info */}
        <Text style={styles.sectionTitle}>
          {isRTL ? '⚙️ تفاصيل النظام والبيئة' : '⚙️ Environment & Platform Details'}
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
              <Server size={18} color={Colors.primary} />
              <Text style={styles.infoLabel}>
                {isRTL ? 'إصدار المنصة' : 'Platform Version'}
              </Text>
            </View>
            <Text style={styles.infoValue}>v1.2.0 (Production Core)</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
              <Layers size={18} color={Colors.primary} />
              <Text style={styles.infoLabel}>
                {isRTL ? 'نوع المعمارية' : 'Architecture'}
              </Text>
            </View>
            <Text style={styles.infoValue}>Multi-Doctor Marketplace</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
              <CheckCircle size={18} color="#16a34a" />
              <Text style={styles.infoLabel}>
                {isRTL ? 'بيئة التشغيل السحابية' : 'Cloud Status'}
              </Text>
            </View>
            <Text style={[styles.infoValue, { color: '#16a34a' }]}>
              Supabase PostgreSQL (Active)
            </Text>
          </View>
        </View>

        {/* Language Selection */}
        <Text style={styles.sectionTitle}>
          {isRTL ? '🌐 لغة العرض' : '🌐 Language'}
        </Text>

        <View style={styles.languageRow}>
          <TouchableOpacity
            style={[
              styles.langBtn,
              language === 'ar' && styles.langBtnActive,
            ]}
            onPress={() => setLanguage('ar')}
          >
            <Globe size={18} color={language === 'ar' ? 'white' : Colors.textPrimary} />
            <Text
              style={[
                styles.langBtnText,
                language === 'ar' && styles.langBtnTextActive,
              ]}
            >
              العربية (RTL)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.langBtn,
              language === 'en' && styles.langBtnActive,
            ]}
            onPress={() => setLanguage('en')}
          >
            <Globe size={18} color={language === 'en' ? 'white' : Colors.textPrimary} />
            <Text
              style={[
                styles.langBtnText,
                language === 'en' && styles.langBtnTextActive,
              ]}
            >
              English (LTR)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <LogOut size={20} color="#dc2626" />
          <Text style={styles.signOutText}>
            {isRTL ? 'تسجيل الخروج من حساب الإدارة' : 'Sign Out of Admin Portal'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    ...Shadows.md,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  adminName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  adminRole: {
    fontSize: 13,
    fontWeight: '600',
    color: '#38bdf8',
    marginBottom: 6,
  },
  adminEmail: {
    fontSize: 12,
    color: '#94a3b8',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
    marginTop: 6,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    ...Shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  langBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    ...Shadows.sm,
  },
  langBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  langBtnTextActive: {
    color: Colors.white,
  },
  signOutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    ...Shadows.sm,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#dc2626',
  },
});
