/*
 * Arte chapada da Vitrine (SVG em linha): scarpins, bolsas, estande e planta do pavilhão.
 * Sem foto, sem degradê. A cor da marca entra por `var(--brand)` (estande e planta acompanham o tema).
 * Também desenha as miniaturas (wireframes) da biblioteca e do seletor de layout.
 */

import type { ReactNode } from 'react';
import { type ArtId, type Shape, WIREFRAMES } from './page-builder-data';

type Colorway = { body: string; heel: string; sole: string };
const CARAMELO: Colorway = { body: '#C28457', heel: '#9A6440', sole: '#7C4F32' };
const AREIA: Colorway = { body: '#E2D6C6', heel: '#C9B9A4', sole: '#A8957F' };
const PRETO: Colorway = { body: '#2B2D33', heel: '#1B1C20', sole: '#111215' };

const BG: Record<ArtId, string> = {
  'par-caramelo': '#EFE8E0',
  'scarpin-caramelo': '#F0EBE5',
  'scarpin-preto': '#ECEEF2',
  'slingback-areia': '#EEEBE6',
  'detalhe-caramelo': '#EFE8E0',
  'bolsa-caramelo': '#ECEEF1',
  'clutch-preto': '#EEEFF2',
  'mule-preto': '#EBEDF0',
  estande: '#E9EDF1',
};

function Pump({ c, sling = false }: { c: Colorway; sling?: boolean }) {
  return (
    <g>
      <path d="M38 61 46.5 63 41.6 100 38.4 100Z" fill={c.heel} />
      <path
        d="M38 40c-3 8-3 16 0 20 18 6 36 28 58 37 16 3 30 3 38 0 4-2 3-7-1-9-11-4-27-8-39-11-14-4-36-19-50-36-2-2-4-2-6-1Z"
        fill={c.body}
      />
      {sling ? (
        <path d="M40 41c6 3 10 9 13 15" fill="none" stroke={c.heel} strokeWidth="3" strokeLinecap="round" />
      ) : (
        <path d="M44 42c14 17 36 31 50 35" fill="none" stroke={c.heel} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      )}
      <path d="M38.5 61c18 6 36 28 57.5 37 16 3 30 3 38 0" fill="none" stroke={c.sole} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}

function Mule({ c }: { c: Colorway }) {
  return (
    <g>
      <path d="M40 66h9l-2 34h-6Z" fill={c.heel} />
      <path d="M36 64c20 4 44 24 64 32 14 4 28 4 36 1 4-2 3-7-1-8-14-5-26-8-36-14-4-14-22-26-40-27-12 0-20 6-23 16Z" fill={c.body} />
      <path d="M62 48c10 4 18 12 22 22" fill="none" stroke={c.heel} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
      <path d="M37 65c20 4 44 24 63 31 14 4 28 4 36 1" fill="none" stroke={c.sole} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}

function Tote({ c }: { c: Colorway }) {
  return (
    <g>
      <path d="M58 54c0-26 44-26 44 0" fill="none" stroke={c.heel} strokeWidth="4" strokeLinecap="round" />
      <path d="M64 54c0-18 32-18 32 0" fill="none" stroke={c.sole} strokeWidth="3" strokeLinecap="round" opacity="0.55" />
      <path d="M44 54h72l7 42q1 7-6 7H43q-7 0-6-7Z" fill={c.body} />
      <rect x="44" y="54" width="72" height="7" fill={c.heel} />
      <path d="M46 66h68" stroke={c.sole} strokeWidth="1.2" strokeDasharray="2 3" opacity="0.6" />
      <rect x="74" y="58" width="12" height="9" rx="2" fill="#C9A66B" />
    </g>
  );
}

function Clutch({ c }: { c: Colorway }) {
  return (
    <g>
      <rect x="34" y="50" width="92" height="46" rx="6" fill={c.body} />
      <path d="M34 57q0-7 7-7h78q7 0 7 7L84 80q-4 3-8 0Z" fill={c.heel} />
      <circle cx="80" cy="78" r="3.4" fill="#C9A66B" />
      <path d="M38 92h84" stroke={c.sole} strokeWidth="1.2" opacity="0.5" />
    </g>
  );
}

function Stand() {
  const shelf = (y: number) => <rect x="84" y={y} width="56" height="2.5" rx="1" fill="#C3CAD3" />;
  const mini = (x: number, y: number, color: string) => (
    <path d={`M${x} ${y}c6 0 9 -4 11 -6 1 3 3 5 3 6Z`} fill={color} />
  );
  return (
    <g>
      <rect width="160" height="120" fill="#E9EDF1" />
      <rect x="10" y="10" width="140" height="6" rx="1" fill="#DCE1E7" />
      <rect x="10" y="16" width="140" height="76" fill="#F7F8FA" />
      <rect x="18" y="24" width="54" height="62" rx="2" fill="var(--brand, #0B7285)" />
      <g transform="translate(45 46)" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="-6" cy="0" r="3" fill="#FFFFFF" stroke="none" />
        <path d="M0-5a7 7 0 0 1 0 10" />
        <path d="M4-9a12 12 0 0 1 0 18" opacity="0.6" />
      </g>
      <rect x="30" y="66" width="30" height="3" rx="1.5" fill="#FFFFFF" opacity="0.8" />
      <rect x="35" y="72" width="20" height="2.5" rx="1.2" fill="#FFFFFF" opacity="0.55" />
      {shelf(38)}
      {shelf(56)}
      {shelf(74)}
      {mini(88, 37.5, CARAMELO.body)}
      {mini(104, 37.5, PRETO.body)}
      {mini(120, 37.5, AREIA.body)}
      {mini(92, 55.5, AREIA.body)}
      {mini(110, 55.5, CARAMELO.body)}
      {mini(126, 55.5, PRETO.body)}
      {mini(96, 73.5, PRETO.body)}
      {mini(116, 73.5, CARAMELO.body)}
      <rect x="0" y="92" width="160" height="28" fill="#DDE2E8" />
      <rect x="62" y="82" width="60" height="24" rx="2" fill="#FFFFFF" />
      <rect x="62" y="82" width="60" height="4" rx="1" fill="#E3E7EC" />
      <rect x="64" y="106" width="56" height="3" fill="#CDD3DB" />
      <circle cx="140" cy="88" r="7" fill="#9BB59A" />
      <rect x="136" y="92" width="8" height="12" rx="1.5" fill="#B9A58C" />
    </g>
  );
}

/** Ilustração de produto ou do estande. `fit`: cobre a moldura ou cabe inteira. */
export function Art({ id, fit = 'preencher', label }: { id: ArtId; fit?: 'preencher' | 'ajustar'; label?: string }) {
  let body: ReactNode;
  switch (id) {
    case 'par-caramelo':
      body = (
        <>
          <ellipse cx="80" cy="101" rx="60" ry="4" fill="#00000010" />
          <g transform="translate(14 -10) scale(0.92)">
            <Pump c={CARAMELO} />
          </g>
          <g transform="translate(-14 4)">
            <Pump c={CARAMELO} />
          </g>
        </>
      );
      break;
    case 'scarpin-caramelo':
      body = (
        <>
          <ellipse cx="80" cy="101" rx="50" ry="4" fill="#00000010" />
          <g transform="translate(-6 0)">
            <Pump c={CARAMELO} />
          </g>
        </>
      );
      break;
    case 'scarpin-preto':
      body = (
        <>
          <ellipse cx="80" cy="101" rx="50" ry="4" fill="#00000012" />
          <g transform="translate(166 0) scale(-1 1)">
            <Pump c={PRETO} />
          </g>
        </>
      );
      break;
    case 'slingback-areia':
      body = (
        <>
          <ellipse cx="80" cy="101" rx="50" ry="4" fill="#00000010" />
          <g transform="translate(-6 0)">
            <Pump c={AREIA} sling />
          </g>
        </>
      );
      break;
    case 'detalhe-caramelo':
      body = (
        <g transform="translate(-125 -93) scale(1.8)">
          <Pump c={CARAMELO} />
        </g>
      );
      break;
    case 'bolsa-caramelo':
      body = (
        <>
          <ellipse cx="80" cy="104" rx="46" ry="4" fill="#00000010" />
          <Tote c={CARAMELO} />
        </>
      );
      break;
    case 'clutch-preto':
      body = (
        <>
          <ellipse cx="80" cy="100" rx="50" ry="4" fill="#00000012" />
          <Clutch c={PRETO} />
        </>
      );
      break;
    case 'mule-preto':
      body = (
        <>
          <ellipse cx="84" cy="101" rx="52" ry="4" fill="#00000012" />
          <Mule c={PRETO} />
        </>
      );
      break;
    default:
      body = <Stand />;
  }
  return (
    <svg
      viewBox="0 0 160 120"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      preserveAspectRatio={fit === 'ajustar' ? 'xMidYMid meet' : 'xMidYMid slice'}
      style={{ display: 'block', width: '100%', height: '100%', background: BG[id] }}
    >
      <rect width="160" height="120" fill={BG[id]} />
      {body}
    </svg>
  );
}

/** Planta do Pavilhão Azul com o estande B-214 na cor da marca. */
export function FloorPlan() {
  const stands: [number, number, number, number][] = [];
  const rows = [26, 70, 122, 166];
  const cols = [24, 76, 128, 180, 232, 284];
  rows.forEach((y, r) => cols.forEach((x, c) => stands.push([x, y, c === 5 ? 36 : 44, r % 2 ? 30 : 30])));
  return (
    <svg viewBox="0 0 340 220" role="img" aria-label="Planta do Pavilhão Azul com o estande B-214" style={{ display: 'block', width: '100%', height: '100%' }}>
      <rect width="340" height="220" fill="#F3F5F8" />
      <rect x="10" y="10" width="320" height="200" rx="6" fill="#FFFFFF" stroke="#DCE1E7" />
      {stands.map(([x, y, w, h], index) =>
        index === 14 ? null : <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="3" fill="#E6E9EE" />,
      )}
      <rect x="128" y="122" width="44" height="30" rx="3" fill="var(--brand, #0B7285)" />
      <text x="150" y="141" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--brand-ink, #fff)" fontFamily="inherit">
        B-214
      </text>
      <g transform="translate(150 104)">
        <path d="M0 14c-6-7-9-11-9-15a9 9 0 0 1 18 0c0 4-3 8-9 15Z" fill="var(--brand, #0B7285)" />
        <circle cx="0" cy="-1" r="3.2" fill="#FFFFFF" />
      </g>
      <text x="20" y="66" fontSize="8.5" fill="#8A93A3" fontFamily="inherit">
        Rua A
      </text>
      <text x="20" y="162" fontSize="8.5" fill="#8A93A3" fontFamily="inherit">
        Rua B
      </text>
      <rect x="150" y="204" width="40" height="6" rx="2" fill="#C9D0DA" />
    </svg>
  );
}

const WF_FILL: Record<Shape[0], string> = {
  h: 'var(--wf-strong)',
  l: 'var(--wf-ink)',
  b: 'var(--wf-fill)',
  a: 'var(--wf-accent)',
  s: 'none',
  p: 'var(--wf-paper)',
  o: 'var(--wf-fill)',
};

/** Miniatura chapada de uma seção (biblioteca e seletor de layout). */
export function Wireframe({ kind, layout }: { kind: string; layout: string }) {
  const shapes = WIREFRAMES[`${kind}/${layout}`] ?? [];
  return (
    <svg viewBox="0 0 120 76" aria-hidden="true" style={{ display: 'block', width: '100%', height: '100%' }}>
      {shapes.map(([type, x, y, w, h], index) =>
        type === 'o' ? (
          <circle key={index} cx={x} cy={y} r={w} fill={WF_FILL.o} />
        ) : (
          <rect
            key={index}
            x={x}
            y={y}
            width={w}
            height={h ?? 3}
            rx={type === 'b' || type === 'p' ? 2.5 : type === 'a' || type === 's' ? 2 : 1.5}
            fill={WF_FILL[type]}
            stroke={type === 's' ? 'var(--wf-accent)' : type === 'p' ? 'var(--wf-line)' : undefined}
            strokeWidth={type === 's' || type === 'p' ? 1 : undefined}
          />
        ),
      )}
    </svg>
  );
}
