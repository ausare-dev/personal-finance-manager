'use client';

import { useEffect } from 'react';

/**
 * Fix for Ant Design responsive observer infinite loop
 * This component patches the responsive observer to prevent infinite loops
 */
export function FixResponsiveObserver() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Patch ResizeObserver to add debouncing
    const OriginalResizeObserver = window.ResizeObserver;
    if (OriginalResizeObserver) {
      window.ResizeObserver = class DebouncedResizeObserver extends OriginalResizeObserver {
        private timeoutId: NodeJS.Timeout | null = null;

        constructor(callback: ResizeObserverCallback) {
          const debouncedCallback: ResizeObserverCallback = (entries, observer) => {
            if (this.timeoutId) {
              clearTimeout(this.timeoutId);
            }
            this.timeoutId = setTimeout(() => {
              callback(entries, observer);
            }, 16); // ~60fps
          };
          super(debouncedCallback);
        }

        disconnect() {
          if (this.timeoutId) {
            clearTimeout(this.timeoutId);
          }
          super.disconnect();
        }
      } as any;
    }

    return () => {
      // Restore original ResizeObserver on unmount
      if (OriginalResizeObserver) {
        window.ResizeObserver = OriginalResizeObserver;
      }
    };
  }, []);

  return null;
}

