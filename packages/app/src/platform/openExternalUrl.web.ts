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
