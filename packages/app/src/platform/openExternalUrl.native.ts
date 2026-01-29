import { Linking } from 'react-native';

export const openExternalUrl = async (url: string): Promise<boolean> => {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to open URL:', error);
    return false;
  }
};
