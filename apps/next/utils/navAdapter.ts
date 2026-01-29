'use client';

import { useRouter } from 'next/navigation';
import type { Nav } from '@ticket-scheduler/app';

export const useNav = (): Nav => {
  const router = useRouter();

  return {
    push: (path: string) => {
      router.push(path);
    },
    replace: (path: string) => {
      router.replace(path);
    },
    back: () => {
      router.back();
    },
  };
};
