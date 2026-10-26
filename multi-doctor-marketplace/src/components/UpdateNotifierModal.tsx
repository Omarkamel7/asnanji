import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { RefreshCw, X, Sparkles, ArrowDownCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Shadows } from '../constants/theme';
import {
  checkForAppUpdates,
  applyOtaUpdate,
  openApkDownload,
  UpdateCheckResult,
} from '../services/versionControl';
import { useApp } from '../context/AppContext';

interface Props {
  autoCheck?: boolean;
}

export const UpdateNotifierModal: React.FC<Props> = ({ autoCheck = true }) => {
  const { language } = useApp();
  const [visible, setVisible] = useState(false);
  const [isApplyingOta, setIsApplyingOta] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);

  useEffect(() => {
    // Only check updates on native platforms (never on web)
    if (autoCheck && Platform.OS !== 'web') {
      checkUpdates();
    }
  }, [autoCheck]);

  const checkUpdates = async () => {
    try {
      const result = await checkForAppUpdates();
      if (result.hasUpdate) {
        // Skip optional update if user previously dismissed it
        if (!result.isMandatory) {
          const dismissed = await AsyncStorage.getItem(`@asnanji_dismissed_update_${result.version}`);
          if (dismissed === 'true') {
            return;
          }
        }
        setUpdateInfo(result);
        setVisible(true);
      }
    } catch (e) {
      console.warn('Update notifier check error:', e);
    }
  };

  const handleDismiss = async () => {
    setVisible(false);
    if (updateInfo?.version) {
      try {
        await AsyncStorage.setItem(`@asnanji_dismissed_update_${updateInfo.version}`, 'true');
      } catch (e) {
        // ignore
      }
    }
  };

  const handleApplyOta = async () => {
    setIsApplyingOta(true);
    try {
      await applyOtaUpdate();
    } catch (e) {
      if (updateInfo?.apkDownloadUrl) {
        openApkDownload(updateInfo.apkDownloadUrl);
      }
    } finally {
      setIsApplyingOta(false);
    }
  };

  const handleDownloadApk = () => {
    openApkDownload(updateInfo?.apkDownloadUrl);
  };

  if (Platform.OS === 'web' || !visible) return null;

  const isAr = language === 'ar';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !updateInfo?.isMandatory && handleDismiss()}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Close button */}
          {!updateInfo?.isMandatory && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleDismiss}
              accessibilityRole="button"
              accessibilityLabel={isAr ? 'إغلاق' : 'Close'}
            >
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}

          {/* App Logo & Badge */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/app_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.badgeRow}>
              <Sparkles size={16} color={Colors.primary} />
              <Text style={styles.badgeText}>
                {isAr
                  ? `تحديث جديد متوفر v${updateInfo?.version || '1.2.0'}`
                  : `New Update v${updateInfo?.version || '1.2.0'}`}
              </Text>
            </View>
          </View>

          {/* Clean Title & Subtitle without exposing internal bullet points */}
          <Text style={styles.title}>
            {isAr ? 'يتوفر تحديث جديد للتطبيق' : 'New Update Available'}
          </Text>
          <Text style={styles.subtitle}>
            {isAr
              ? 'يتضمن هذا التحديث تحسينات عامة في الأداء واستقرار التطبيق لتجربة أفضل.'
              : 'This update includes performance improvements and stability enhancements for a better experience.'}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {/* Direct APK Download Button */}
            <TouchableOpacity style={styles.btnPrimary} onPress={handleDownloadApk}>
              <ArrowDownCircle size={20} color={Colors.white} />
              <Text style={styles.btnPrimaryText}>
                {isAr ? 'تحديث الآن (تحميل APK)' : 'Update Now (Download APK)'}
              </Text>
            </TouchableOpacity>

            {/* In-App OTA Update Button (If available) */}
            {updateInfo?.hasOtaUpdate && (
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={handleApplyOta}
                disabled={isApplyingOta}
              >
                {isApplyingOta ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <RefreshCw size={18} color={Colors.primary} />
                    <Text style={styles.btnSecondaryText}>
                      {isAr ? 'تطبيق التحديث الفوري داخل التطبيق' : 'Apply Instant In-App Update'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Dismiss Button */}
            {!updateInfo?.isMandatory && (
              <TouchableOpacity
                style={styles.btnDismiss}
                onPress={handleDismiss}
              >
                <Text style={styles.btnDismissText}>
                  {isAr ? 'تذكيري لاحقاً' : 'Remind me later'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Shadows.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginVertical: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    ...Shadows.md,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  btnDismiss: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  btnDismissText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '700',
  },
});
