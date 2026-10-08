import { Linking } from 'react-native';
import * as Updates from 'expo-updates';

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

export const APP_VERSION_DATA: AppVersionInfo = {
  version: '1.0.0',
  buildNumber: 1,
  releaseDate: '2026-08-30',
  channel: 'production',
  latestVersion: '1.0.0',
  isUpdateAvailable: false,
  mandatoryUpdate: false,
  changelogAr: [
    'الإصدار الرسمي الأول لمنصة اسنانجي الطبية v1.0.0',
    'لوحة تحكم كاملة للطبيب مع ميزة إظهار وإخفاء الحساب من دليل المرضى',
    'إدارة متكاملة للخدمات والأسعار ومعرض الحالات قبل وبعد (Before & After)',
    'نظام الاستشارات الفورية والتشخيص المبدئي المباشر مع المرضى',
    'نظام حجز الكشوفات ومواعيد العيادة وتحديد أوقات العمل',
    'شات مباشر فائق الثبات مع دعم التسجيلات الصوتية والصور',
  ],
  changelogEn: [
    'Official Initial Release of Asnanji Dental Platform v1.0.0',
    'Complete Doctor Control Hub with Public Directory Visibility toggle',
    'Full management for clinic services, pricing, and Before & After portfolio',
    'Instant online consultation and patient triage system',
    'Integrated appointment booking and working hours scheduler',
    'Rock-solid direct chat with voice notes and image attachments',
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
      const latestTag = (release.tag_name || '').replace('v', '').trim();
      
      let apkUrl = 'https://github.com/Omarkamel7/asnanji/releases/latest';
      if (release.assets && Array.isArray(release.assets)) {
        const apkAsset = release.assets.find((a: any) => a.name?.endsWith('.apk'));
        if (apkAsset && apkAsset.browser_download_url) {
          apkUrl = apkAsset.browser_download_url;
        }
      }
      const expoBuildMatch = release.body?.match(/https:\/\/expo\.dev\/accounts\/[^\s\)\<"]+/);
      if (expoBuildMatch) {
        apkUrl = expoBuildMatch[0];
      }

      if (latestTag && isNewerVersion(latestTag, APP_VERSION_DATA.version)) {
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
    version: APP_VERSION_DATA.version,
    apkDownloadUrl: 'https://github.com/Omarkamel7/asnanji/releases/latest',
    releaseNotesAr: 'تطبيق اسنانجي محدث لآخر إصدار v1.0.0',
    releaseNotesEn: 'Asnanji app is up to date v1.0.0',
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
