import { useHaptic } from 'react-haptic';
import * as Haptics from 'expo-haptics';

export function useAppHaptic() {
  const { vibrate } = useHaptic();

  const triggerHaptic = (style?: Haptics.ImpactFeedbackStyle) => {
    vibrate();
  };
  
  const triggerNotification = (type?: Haptics.NotificationFeedbackType) => {
    vibrate();
  };

  const triggerSelection = () => {
    vibrate();
  };

  return { triggerHaptic, triggerNotification, triggerSelection };
}
