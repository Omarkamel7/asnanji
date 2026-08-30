import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { Download, RefreshCw, X, Sparkles, CheckCircle2, ArrowDownCircle } from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import {
  checkForAppUpdates,
  applyOtaUpdate,
  openApkDownload,
  UpdateCheckResult,
  APP_VERSION_DATA,
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
    if (autoCheck) {
      checkUpdates();
    }
  }, [autoCheck]);

  const checkUpdates = async () => {
    try {
      const result = await checkForAppUpdates();
      if (result.hasUpdate) {
        setUpdateInfo(result);
        setVisible(true);
      }
    } catch (e) {
      console.warn('Update notifier check error:', e);
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

  if (!visible) return null;

  const isAr = language === 'ar';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !updateInfo?.isMandatory && setVisible(false)}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Close button */}
          {!updateInfo?.isMandatory && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setVisible(false)}
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
                  ? `تحديث جديد متوفر v${updateInfo?.version || '1.1.0'}`
                  : `New Update v${updateInfo?.version || '1.1.0'}`}
              </Text>
            </View>
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>
            {isAr ? 'يتوفر إصدار أحدث لتطبيق العيادة!' : 'A newer version is ready!'}
          </Text>
          <Text style={styles.subtitle}>
            {isAr
              ? 'قمنا بإضافة تحسينات كبرى، اللوجو فائق الدقة، إدارة العيادة، وتحديث واجهات الاستشارة.'
              : 'Major updates, HD logo, dynamic clinic management, and consultation enhancements.'}
          </Text>

          {/* Changelog Items */}
          <View style={styles.changelogBox}>
            <Text style={styles.changelogHeader}>
              {isAr ? '✨ أبرز ما تم إضافته في هذا التحديث:' : '✨ What is new in this update:'}
            </Text>
            <ScrollView style={styles.changelogScroll} showsVerticalScrollIndicator={false}>
              {(isAr ? APP_VERSION_DATA.changelogAr : APP_VERSION_DATA.changelogEn).map(
                (item, idx) => (
                  <View key={idx} style={styles.changelogItem}>
                    <CheckCircle2 size={16} color={Colors.routine} style={{ marginTop: 2 }} />
                    <Text style={styles.changelogText}>{item}</Text>
                  </View>
                )
              )}
            </ScrollView>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {/* Direct GitHub APK Download Button */}
            <TouchableOpacity style={styles.btnPrimary} onPress={handleDownloadApk}>
              <ArrowDownCircle size={20} color={Colors.white} />
              <Text style={styles.btnPrimaryText}>
                {isAr ? 'تنزيل وتثبيت التحديث (APK مباشر)' : 'Download & Install APK'}
              </Text>
            </TouchableOpacity>

            {/* In-App OTA Update Button */}
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

            {/* Skip Button */}
            {!updateInfo?.isMandatory && (
              <TouchableOpacity
                style={styles.btnDismiss}
                onPress={() => setVisible(false)}
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
    padding: 22,
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
    marginBottom: 10,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 4,
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
    fontSize: 17,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginVertical: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  changelogBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  changelogHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  changelogScroll: {
    maxHeight: 120,
  },
  changelogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  changelogText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textPrimary,
    lineHeight: 16,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    gap: 8,
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
    paddingVertical: 8,
  },
  btnDismissText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '700',
  },
});
