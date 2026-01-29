'use client';

import { useEffect, useLayoutEffect } from 'react';

// Use useLayoutEffect on client, useEffect during SSR
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function ReactNativeWebProvider({ children }: { children: React.ReactNode }) {
  useIsomorphicLayoutEffect(() => {
    // Inject react-native-web styles dynamically
    const styleId = 'react-native-web-stylesheet';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* React Native Web base styles */
      [data-rnw] {
        display: flex;
        flex-direction: column;
      }
      [data-rnw-int-class~="r-flex-1"] {
        flex: 1;
      }
      [data-rnw-int-class~="r-flexDirection-column"] {
        flex-direction: column;
      }
      [data-rnw-int-class~="r-flexDirection-row"] {
        flex-direction: row;
      }
      [data-rnw-int-class~="r-alignItems-center"] {
        align-items: center;
      }
      [data-rnw-int-class~="r-justifyContent-center"] {
        justify-content: center;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return <>{children}</>;
}
