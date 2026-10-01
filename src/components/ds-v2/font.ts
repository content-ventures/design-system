import localFont from 'next/font/local';

export const inter = localFont({
  src: [
    { path: '../../fonts/inter-regular.woff2', weight: '400' },
    { path: '../../fonts/inter-medium.woff2', weight: '500' },
    { path: '../../fonts/inter-semibold.woff2', weight: '600' },
  ],
  variable: '--font-dashboard',
  display: 'swap',
});
