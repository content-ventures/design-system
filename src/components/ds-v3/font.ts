import localFont from 'next/font/local';

/**
 * Inter local 400/500/600, romana e itálica. Uma família para toda a interface; números usam `tnum`
 * onde há coluna. O itálico é face real: o tema usa `font-synthesis: none`, então sem estes arquivos
 * `<em>` sairia em pé.
 */
export const interV3 = localFont({
  src: [
    { path: '../../fonts/inter-regular.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/inter-medium.woff2', weight: '500', style: 'normal' },
    { path: '../../fonts/inter-semibold.woff2', weight: '600', style: 'normal' },
    { path: '../../fonts/inter-italic.woff2', weight: '400', style: 'italic' },
    { path: '../../fonts/inter-medium-italic.woff2', weight: '500', style: 'italic' },
    { path: '../../fonts/inter-semibold-italic.woff2', weight: '600', style: 'italic' },
  ],
  variable: '--font-v3',
  display: 'swap',
});
