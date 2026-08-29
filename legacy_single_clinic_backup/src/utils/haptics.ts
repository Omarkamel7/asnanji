import * as Haptics from 'expo-haptics';

export const lightTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
export const mediumTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
export const heavyTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
export const successTap = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
export const errorTap = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
export const warningTap = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
