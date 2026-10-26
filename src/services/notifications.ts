import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Requests push notification permissions and retrieves the Expo Push Token.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  try {
    if (Platform.OS === 'web') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'إشعارات اسنانجي',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0284c7',
        sound: 'default',
        enableVibrate: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Push notification permissions not granted');
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      'b9170b46-6ab5-4b6f-9d61-b659e3e9bc50';

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    }).catch((err) => {
      console.warn('[Notifications] getExpoPushTokenAsync fallback without projectId:', err);
      return Notifications.getExpoPushTokenAsync().catch(() => null);
    });

    token = tokenResponse?.data || null;
    if (token) {
      console.log('[Notifications] Expo Push Token obtained:', token);
    }
  } catch (error) {
    console.warn('[Notifications] Error registering for push notifications:', error);
  }

  return token;
}

/**
 * Saves or updates user's push token into Supabase profiles table.
 */
export async function syncPushTokenWithProfile(userId: string): Promise<void> {
  if (!userId || Platform.OS === 'web') return;

  try {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId);
      console.log('[Notifications] Push token synced successfully for user:', userId);
    }
  } catch (err) {
    console.warn('[Notifications] Failed to sync push token:', err);
  }
}

export interface PushNotificationPayload {
  toUserId?: string;           // Target user profile ID
  pushToken?: string;          // Direct token if known
  title: string;               // Notification title
  body: string;                // Notification body
  data?: Record<string, any>;  // Navigation / Deep link payload
  badge?: number;
}

/**
 * Dispatches an instant push notification via the official Expo Push API.
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
  try {
    let targetToken = payload.pushToken;

    // 1. If toUserId is provided, query their push_token from Supabase
    if (!targetToken && payload.toUserId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', payload.toUserId)
        .maybeSingle();

      if (!error && data?.push_token) {
        targetToken = data.push_token;
      }
    }

    if (!targetToken) {
      console.log('[Push] No push token found for user:', payload.toUserId);
      return false;
    }

    // Must be a valid Expo push token
    if (!targetToken.startsWith('ExponentPushToken[') && !targetToken.startsWith('ExpoPushToken[')) {
      console.log('[Push] Invalid token format for user:', payload.toUserId, targetToken);
      return false;
    }

    const message = {
      to: targetToken,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      badge: payload.badge || 1,
      channelId: 'default',
      priority: 'high',
      _displayInForeground: true,
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const resJson = await response.json();
    console.log('[Push] Notification dispatched successfully:', resJson);
    return true;
  } catch (err) {
    console.warn('[Push] Error sending push notification:', err);
    return false;
  }
}

/**
 * Triggers a local device notification (for in-app alerts).
 */
export async function triggerLocalNotification(title: string, body: string, data?: Record<string, any>) {
  try {
    if (Platform.OS === 'web') return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: null, // show immediately
    });
  } catch (err) {
    console.warn('[Push] Error triggering local notification:', err);
  }
}

/**
 * Notify doctor when patient sends a message or submits a consultation.
 */
export async function notifyDoctorOfNewConsultation(
  doctorId: string,
  patientName: string,
  urgencyLevel?: string
) {
  const urgencyLabel = urgencyLevel === 'urgent' ? '🚨 استشارة عاجلة' : '🩺 استشارة جديدة';
  return sendPushNotification({
    toUserId: doctorId,
    title: `${urgencyLabel} من ${patientName || 'مريض'}`,
    body: 'وصلتك استشارة طبية جديدة عبر تطبيق اسنانجي. اضغط للمعاينة والرد.',
    data: { type: 'consultation', doctorId },
  });
}

/**
 * Notify doctor when a patient books a new clinic appointment.
 */
export async function notifyDoctorOfNewAppointment(
  doctorId: string,
  patientName: string,
  date: string,
  timeSlot: string
) {
  return sendPushNotification({
    toUserId: doctorId,
    title: `📅 حجز موعد جديد من ${patientName || 'مريض'}`,
    body: `تم حجز موعد كشف جديد بتاريخ ${date} الساعة ${timeSlot}.`,
    data: { type: 'appointment', doctorId },
  });
}

/**
 * Notify patient when their appointment status changes (confirmed / cancelled / completed).
 */
export async function notifyPatientOfAppointmentStatus(
  patientId: string,
  doctorName: string,
  status: string,
  date: string,
  timeSlot: string
) {
  const statusLabel =
    status === 'confirmed'
      ? 'تم تأكيد موعدك بنجاح'
      : status === 'cancelled'
      ? 'تم إلغاء الموعد'
      : status === 'completed'
      ? 'تم إكمال الزيارة'
      : 'تحديث في موعدك';

  return sendPushNotification({
    toUserId: patientId,
    title: `📅 ${statusLabel}`,
    body: `موعدك مع د. ${doctorName || 'طبيبك'} بتاريخ ${date} الساعة ${timeSlot} أصبح: ${statusLabel}.`,
    data: { type: 'appointment', patientId },
  });
}

/**
 * Notify recipient of a new incoming chat message.
 */
export async function notifyChatMessage(
  recipientUserId: string,
  senderName: string,
  senderRole: string,
  text: string,
  consultationId: string
) {
  const title =
    senderRole === 'doctor'
      ? `🩺 د. ${senderName || 'طبيبك'}`
      : `💬 ${senderName || 'المريض'}`;

  const snippet = text.length > 80 ? text.substring(0, 77) + '...' : text;

  return sendPushNotification({
    toUserId: recipientUserId,
    title,
    body: snippet || 'أرسل لك مرفقاً جديداً في المحادثة',
    data: { type: 'chat', consultationId },
  });
}

/**
 * Notify patient when doctor submits medical diagnosis.
 */
export async function notifyPatientOfDiagnosis(
  patientId: string,
  doctorName: string,
  consultationId: string
) {
  return sendPushNotification({
    toUserId: patientId,
    title: `🩺 تم الرد على استشارتك من د. ${doctorName || 'طبيبك'}`,
    body: 'قام الطبيب بتقديم التشخيص والتوصيات الطبية لحالتك. اضغط للمعاينة.',
    data: { type: 'consultation', consultationId },
  });
}
