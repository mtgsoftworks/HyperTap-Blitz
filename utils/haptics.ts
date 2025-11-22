import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNative } from './platform';

/**
 * Trigger haptic feedback using native API when available, fallback to web vibration
 */
export const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' | 'success' | 'failure') => {
  try {
    if (isNative()) {
      // Use Capacitor native haptics for better experience on mobile
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'failure':
          await Haptics.notification({ type: NotificationType.Error });
          break;
      }
    } else {
      // Fallback to web vibration API
      if (!navigator.vibrate) return;

      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate([50, 30, 50]);
          break;
        case 'success':
          navigator.vibrate([10, 30, 10]);
          break;
        case 'failure':
          navigator.vibrate([50, 50, 100, 50, 100]);
          break;
      }
    }
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
};