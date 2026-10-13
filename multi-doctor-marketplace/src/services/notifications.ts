import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
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
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'إشعارات اسنانجي',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0284c7',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permissions not granted');
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync().catch(() => null);
    token = tokenResponse?.data || null;
  } catch (error) {
    console.warn('Error registering for push notifications:', error);
  }

  return token;
}

/**
 * Saves or updates user's push token into Supabase profiles table.
 */
export async function syncPushTokenWithProfile(userId: string): Promise<void> {
  if (!userId) return;

  try {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId);
      console.log('Push token synced successfully for user:', userId);
    }
  } catch (err) {
    console.warn('Failed to sync push token:', err);
  }
}
