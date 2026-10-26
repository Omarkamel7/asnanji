import { Linking, Platform } from 'react-native';
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

export const getCurrentAppVersion = (): string => {
  return (
    Constants.expoConfig?.version ||
    Constants.nativeAppVersion ||
    (Constants.manifest as any)?.version ||
    '1.3.1'
  );
};

export const getCurrentBuildNumber = (): number => {
  const nativeBuild = Constants.nativeBuildVersion ? parseInt(Constants.nativeBuildVersion, 10) : NaN;
  if (!isNaN(nativeBuild) && nativeBuild > 0) return nativeBuild;
  return (
    Constants.expoConfig?.android?.versionCode ||
    8
  );
};

const RUNTIME_APP_VERSION = getCurrentAppVersion();
const RUNTIME_BUILD_NUMBER = getCurrentBuildNumber();

export const APP_VERSION_DATA: AppVersionInfo = {
  version: RUNTIME_APP_VERSION,
  buildNumber: RUNTIME_BUILD_NUMBER,
  releaseDate: '2026-10-26',
  channel: 'production',
  latestVersion: RUNTIME_APP_VERSION,
  isUpdateAvailable: false,
  mandatoryUpdate: false,
  changelogAr: [
    'إصلاح وتفعيل تسجيل الدخول بحساب جوجل (Google Sign-In) عبر نظام المصادقة PKCE',
    'تفعيل نظام الإشعارات الفورية اللحظية (Push Notifications) للرسائل والمواعيد',
    'إصلاح وتأمين اعتماد طلبات انضمام الأطباء وتحديث بياناتهم لحظياً',
    'تطهير وإزالة كافة الحسابات والبيانات التجريبية لتجهيز المنصة للإنتاج',
  ],
  changelogEn: [
    'Fixed and activated Google Sign-In with PKCE session exchange',
    'Enabled Real-time Push Notifications for chat and clinic appointments',
    'Doctor verification workflow and RLS security policies update',
    'Purged all legacy mock data and test profiles for production',
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

export function isNewerVersion(remote: string, local: string): boolean {
  if (!remote || !local) return false;
  const cleanRemote = remote.replace(/^v/i, '').trim();
  const cleanLocal = local.replace(/^v/i, '').trim();

  // If identical, remote is definitely not newer
  if (cleanRemote === cleanLocal) return false;

  const rParts = cleanRemote.split('.').map((n) => parseInt(n, 10) || 0);
  const lParts = cleanLocal.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(rParts.length, lParts.length); i++) {
    const r = rParts[i] ?? 0;
    const l = lParts[i] ?? 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

/**
 * Checks for new app updates via GitHub releases and Expo OTA updates.
 */
export async function checkForAppUpdates(): Promise<UpdateCheckResult> {
  const currentVersion = getCurrentAppVersion();

  // On Web, the app is automatically up to date via browser deployment
  if (Platform.OS === 'web') {
    return {
      hasUpdate: false,
      hasOtaUpdate: false,
      version: currentVersion,
      apkDownloadUrl: '',
      releaseNotesAr: `تطبيق اسنانجي محدث لأحدث نسخة.`,
      releaseNotesEn: `Asnanji web is running the latest version.`,
      isMandatory: false,
    };
  }

  let hasOta = false;

  // 1. Check Expo OTA Updates (native only)
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
        return {
          hasUpdate: true,
          hasOtaUpdate: hasOta,
          version: latestTag,
          apkDownloadUrl: apkUrl,
          releaseNotesAr: 'يتضمن هذا التحديث تحسينات عامة في الأداء واستقرار التطبيق.',
          releaseNotesEn: 'This update includes performance improvements and stability enhancements.',
          isMandatory: false,
        };
      }
    }
  } catch (err) {
    console.warn('GitHub update check failed:', err);
  }

  return {
    hasUpdate: false,
    hasOtaUpdate: false,
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
