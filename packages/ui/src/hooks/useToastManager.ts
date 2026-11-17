import { Toast as BaseToast } from '@base-ui/react/toast';

/*
 * Wrapped so consumers queue toasts without importing `@base-ui/react`; the
 * library owns the whole surface (docs/adr/0002). Call it anywhere beneath
 * `Toast.Provider`.
 */
export function useToastManager() {
  return BaseToast.useToastManager();
}
