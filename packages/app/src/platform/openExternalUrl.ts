// This file is the default export for bundlers that don't support platform-specific extensions
// Metro (React Native) and Webpack with react-native-web will resolve to .native.ts or .web.ts

declare const window: {
  open: (url: string, target?: string, features?: string) => unknown;
};

export const openExternalUrl = async (url: string): Promise<boolean> => {
  try {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  } catch (error) {
    console.error('Failed to open URL:', error);
    return false;
  }
};
