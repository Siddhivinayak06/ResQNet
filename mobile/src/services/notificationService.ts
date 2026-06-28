import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

// ─── Configure default notification behavior ────────────────
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // May fail in Expo Go — non-critical
}

// ─── Types ───────────────────────────────────────────────────
export interface NotificationState {
  granted: boolean;
  token: string | null;
}

// ─── Service ─────────────────────────────────────────────────
export const notificationService = {
  /**
   * Request notification permissions and get push token.
   * Gracefully degrades in Expo Go where remote notifications are unavailable.
   */
  async register(): Promise<NotificationState> {
    try {
      // Physical device check
      if (!Device.isDevice) {
        console.log('ℹ️ Push notifications require a physical device.');
        return { granted: false, token: null };
      }

      // Check existing permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('ℹ️ Notification permission denied.');
        return { granted: false, token: null };
      }

      // Android notification channels (works in Expo Go)
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('emergency', {
            name: 'Emergency Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#ef4444',
            sound: 'default',
          });
          await Notifications.setNotificationChannelAsync('updates', {
            name: 'Incident Updates',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
          });
        } catch {
          // Channel setup may fail in Expo Go — non-critical
        }
      }

      // Push token — will fail in Expo Go (SDK 53+), that's expected
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        return { granted: true, token: tokenData.data };
      } catch {
        console.log('ℹ️ Push token unavailable (expected in Expo Go). Use a dev build for push notifications.');
        return { granted: true, token: null };
      }
    } catch (err) {
      // Catch-all: notification system completely unavailable
      console.log('ℹ️ Notifications not available:', err instanceof Error ? err.message : err);
      return { granted: false, token: null };
    }
  },

  /**
   * Send the push token to the backend for server-side notifications.
   */
  async sendTokenToBackend(token: string): Promise<void> {
    try {
      await api.post('/auth/push-token', { pushToken: token });
    } catch {
      // Silently fail — backend may not have this endpoint yet
      console.log('ℹ️ Push token registration skipped (endpoint may not exist).');
    }
  },

  /**
   * Schedule a local notification (e.g., for offline queue sync).
   */
  async showLocalNotification(
    title: string,
    body: string,
    channelId: string = 'updates'
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          ...(Platform.OS === 'android' ? { channelId } : {}),
        },
        trigger: null,
      });
    } catch {
      // Local notifications may not work in Expo Go
      console.log('ℹ️ Local notification skipped (unavailable in Expo Go).');
    }
  },

  /**
   * Add a listener for notification received while app is in foreground.
   */
  onNotificationReceived(
    handler: (notification: Notifications.Notification) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(handler);
  },

  /**
   * Add a listener for when user taps a notification.
   */
  onNotificationResponse(
    handler: (response: Notifications.NotificationResponse) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(handler);
  },
};
