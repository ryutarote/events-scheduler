import { useRouter } from 'expo-router';
import type { Nav } from '@ticket-scheduler/app';

export const useNav = (): Nav => {
  const router = useRouter();

  return {
    push: (path: string) => {
      router.push(path as any);
    },
    replace: (path: string) => {
      router.replace(path as any);
    },
    back: () => {
      router.back();
    },
  };
};
