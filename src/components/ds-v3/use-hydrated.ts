'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

/** O controle só aceita eventos quando o HTML de servidor já está interativo. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, clientReady, serverReady);
}
