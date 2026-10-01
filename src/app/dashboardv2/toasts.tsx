'use client';

export {
  ToastCard,
  ToastViewport,
  type ToastVariant,
  type ToastInput,
  type ToastNotice,
  type Notify,
} from '../../components/ds-v2/toasts';
import { useToast as useLibraryToast } from '../../components/ds-v2/toasts';
export const useToast = () => useLibraryToast({ fallbackFocusId: 'workspace-content' });
