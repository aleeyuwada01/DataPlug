import * as Haptics from 'expo-haptics';

export function useAppHaptic() {
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style);
  };
  
  const triggerNotification = (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
    Haptics.notificationAsync(type);
  };

  const triggerSelection = () => {
    Haptics.selectionAsync();
  };

  return { triggerHaptic, triggerNotification, triggerSelection };
}
