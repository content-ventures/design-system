import localFont from 'next/font/local';

/** Inter local 400/500/600. Uma família para toda a interface; números usam `tnum` onde há coluna. */
export const interV3 = localFont({
  src: [
    { path: '../../fonts/inter-regular.woff2', weight: '400' },
    { path: '../../fonts/inter-medium.woff2', weight: '500' },
    { path: '../../fonts/inter-semibold.woff2', weight: '600' },
  ],
  variable: '--font-v3',
  display: 'swap',
});
