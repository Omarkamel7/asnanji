import { Linking } from 'react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';

export interface AppVersionInfo {
  version: string;
  buildNumber: number;
  releaseDate: string;
  channel: 'production' | 'preview' | 'development';
  latestVersion: string;
  isUpdateAvailable: boolean;
  mandatoryUpdate: boolean;
  changelogAr: string[];
  changelogEn: string[];
}

const RUNTIME_APP_VERSION = Constants.expoConfig?.version || '1.2.0';
const RUNTIME_BUILD_NUMBER = Constants.expoConfig?.android?.versionCode || 5;

export const APP_VERSION_DATA: AppVersionInfo = {
  version: RUNTIME_APP_VERSION,
  buildNumber: RUNTIME_BUILD_NUMBER,
  releaseDate: '2026-10-13',
  channel: 'production',
  latestVersion: RUNTIME_APP_VERSION,
  isUpdateAvailable: false,
  mandatoryUpdate: false,
  changelogAr: [
    'إصدار اسنانجي v1.2.0 - التحديث الشامل لمنظومة الأدوار ومجسم الفك',
    'لوحة تحكم المدير العام (Super Admin) مع فحص شامل لاستمارات وتراخيص الأطباء',
    'واجهة سكرتارية واستقبال مخصصة لإدارة جدول المواعيد اليومي للمرضى',
    'شاشة متابعة وتدقيق حالة انضمام الأطباء الجدد وترخيص النقابة',
    'مجسم الفك والأسنان التشريحي 3D المحدث بدون قص مع ميزة التكبير لشاشة كاملة',
    'أفاتار طبي ديناميكي موحد وإلغاء كافة الصور والبيانات التجريبية',
    'إصلاح مسارات تسجيل الدخول والخروج الشامل ومنع تجميد الشاشات',
    'تحسينات كبرى في الأداء وتسريع المحادثات واستعلامات البيانات',
  ],
  changelogEn: [
    'Asnanji Release v1.2.0 - Multi-Persona Platform Overhaul',
    'Super Admin Central Dashboard with full doctor credential inspection',
    'Clinic Receptionist Schedule interface for patient queue management',
    'Doctor Verification Tracker Screen for new registrations',
    'Updated 3D Dental Arch Model with full-screen interactive zoom',
    'Unified dynamic DoctorAvatar component replacing static mockups',
    'Auth stability fixes, global sign-out, and unfreezing navigation',
    'Performance optimizations for chat and database queries',
  ],
};

export interface UpdateCheckResult {
  hasUpdate: boolean;
  hasOtaUpdate: boolean;
  version: string;
  apkDownloadUrl: string;
  releaseNotesAr: string;
  releaseNotesEn: string;
  isMandatory: boolean;
}

function isNewerVersion(remote: string, local: string): boolean {
  const rParts = remote.split('.').map((n) => parseInt(n, 10) || 0);
  const lParts = local.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(rParts.length, lParts.length); i++) {
    const r = rParts[i] ?? 0;
    const l = lParts[i] ?? 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

function cleanMarkdownNotes(text: string): string {
  if (!text) return '';
  return text
    .replace(/###+/g, '')
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

/**
 * Checks for new app updates via GitHub releases and Expo OTA updates.
 */
export async function checkForAppUpdates(): Promise<UpdateCheckResult> {
  let hasOta = false;

  // 1. Check Expo OTA Updates
  try {
    if (!__DEV__) {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        hasOta = true;
      }
    }
  } catch (err) {
    // OTA check can fail in local dev or without network
  }

  const currentVersion = Constants.expoConfig?.version || APP_VERSION_DATA.version;

  // 2. Check GitHub Releases for New APK
  try {
    const response = await fetch(
      'https://api.github.com/repos/Omarkamel7/asnanji/releases/latest',
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (response.ok) {
      const release = await response.json();
      const latestTag = (release.tag_name || '').replace(/^v/i, '').trim();
      
      let apkUrl = 'https://github.com/Omarkamel7/asnanji/releases/latest';
      if (release.assets && Array.isArray(release.assets)) {
        const apkAsset = release.assets.find((a: any) => a.name?.endsWith('.apk'));
        if (apkAsset && apkAsset.browser_download_url) {
          apkUrl = apkAsset.browser_download_url;
        }
      }

      if (latestTag && isNewerVersion(latestTag, currentVersion)) {
        const cleanNotes = cleanMarkdownNotes(release.body) || 'تحديث جديد متاح لتحسين تجربتك.';
        return {
          hasUpdate: true,
          hasOtaUpdate: hasOta,
          version: latestTag,
          apkDownloadUrl: apkUrl,
          releaseNotesAr: cleanNotes,
          releaseNotesEn: cleanNotes,
          isMandatory: false,
        };
      }
    }
  } catch (err) {
    console.warn('GitHub update check failed:', err);
  }

  return {
    hasUpdate: hasOta,
    hasOtaUpdate: hasOta,
    version: currentVersion,
    apkDownloadUrl: 'https://github.com/Omarkamel7/asnanji/releases/latest',
    releaseNotesAr: `تطبيق اسنانجي محدث لآخر إصدار v${currentVersion}`,
    releaseNotesEn: `Asnanji app is up to date v${currentVersion}`,
    isMandatory: false,
  };
}

/**
 * Downloads and applies the Expo OTA update immediately.
 */
export async function applyOtaUpdate(): Promise<void> {
  try {
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  } catch (err) {
    console.warn('Failed to apply OTA update:', err);
    throw err;
  }
}

/**
 * Opens the APK download link in the browser.
 */
export async function openApkDownload(url?: string): Promise<void> {
  const targetUrl = url || 'https://github.com/Omarkamel7/asnanji/releases/latest';
  const canOpen = await Linking.canOpenURL(targetUrl);
  if (canOpen) {
    await Linking.openURL(targetUrl);
  }
}
