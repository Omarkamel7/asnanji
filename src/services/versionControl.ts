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
  version: '1.1.0',
  buildNumber: 3,
  releaseDate: '2026-10-13',
  channel: 'production',
  latestVersion: '1.1.0',
  isUpdateAvailable: false,
  mandatoryUpdate: false,
  changelogAr: [
    'إصدار اسنانجي v1.1.0 - التحديث الأكبر للمنصة',
    'نظام الروشتة الطبية الرقمية المعتمدة PDF مع إمكانية التحميل والطباعة ومشاركة واتساب فورياً',
    'قنوات الإشعارات اللحظية للتنبيهات وتحديثات مواعيد واستشارات العيادة',
    'نموذج فك الأسنان التفاعلي ثلاثي الأبعاد الواقعي (FDI 1-32)',
    'تسجيل الدخول السريع عبر Google بنقرة واحدة وربط رقم الهاتف الفوري',
    'لوحة مراجعة واعتماد طلبات الأطباء الجدد (Super Admin Hub)',
    'إدارة مساعدي وسكرتارية العيادة بصلاحيات جدول المواعيد',
    'تسريع رفع وفحص الصور والأشعات بتقنية WebP الموفرة للباقة بنسبة 80%',
  ],
  changelogEn: [
    'Asnanji Release v1.1.0 - Major Platform Upgrade',
    'Official Digital Prescription PDF with 1-tap download, WhatsApp share, and wireless direct printing',
    'Instant Push Notifications for appointment and consultation alerts',
    'Realistic 3D Interactive Dental Arch Model (FDI 1-32)',
    '1-Tap Google Sign-In with zero-cost phone number linking modal',
    'Super Admin Doctor Onboarding Application & Verification Hub',
    'Clinic Receptionist & Assistant Management with calendar-only access',
    'Silent WebP image pipeline saving 80% bandwidth with 3x faster uploads',
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
