import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia?.(query);
      mql?.addEventListener('change', onChange);
      return () => mql?.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia?.(query).matches ?? false);
}

/** Phones: below Tailwind's `md` breakpoint (768px). Tablets and desktops keep the sidebar layout. */
export const useIsMobile = () => useMediaQuery('(max-width: 767.98px)');
