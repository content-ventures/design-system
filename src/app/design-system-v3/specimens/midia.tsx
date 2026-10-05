'use client';

import {
  FileText,
  LogOut,
  Megaphone,
  Paperclip,
  Pencil,
  Send,
  Settings,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import {
  PortalSwitcher,
  SidebarAccount,
  SidebarItem,
  type Portal,
} from '@content-ventures/design-system/v3/app-shell';
import { AttachmentChip, AttachmentPreview, AttachmentRow } from '@content-ventures/design-system/v3/attachment';
import { Button, ButtonGroup, IconButton } from '@content-ventures/design-system/v3/button';
import { Carousel, Gallery, type GalleryItem } from '@content-ventures/design-system/v3/gallery';
import {
  Avatar,
  AvatarGroup,
  BrandLockup,
  BrandMark,
  MadeWith,
  MediaOnMark,
} from '@content-ventures/design-system/v3/identity';
import { LinkButton } from '@content-ventures/design-system/v3/link';
import { MediaFrame, formatBytes } from '@content-ventures/design-system/v3/media';
import type { MenuSection } from '@content-ventures/design-system/v3/overlays';
import { Checkbox, Segmented } from '@content-ventures/design-system/v3/selection';
import { Dropzone, FileRow } from '@content-ventures/design-system/v3/upload';
import { VideoPlayer, type VideoCue } from '@content-ventures/design-system/v3/video';
import { Shot, Shots, State, States } from '../stage';
import x from './midia.module.css';

/* ——————————————————————————— Arte (SVG inline, chapada) ——————————————————————————— */

const FONT = `font-family="Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif"`;

function svgUri(w: number, h: number, body: string) {
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

type ShoeKind = 'sneaker' | 'loafer' | 'boot' | 'pump';

/** Silhuetas num quadro de 240 × 110 (bico à direita). */
function shoe(kind: ShoeKind, upper: string, sole: string, detail: string) {
  switch (kind) {
    case 'sneaker':
      return `<path d="M10 91H236C239 91 241 93 241 96V99C241 103 238 106 234 106H17C13 106 10 103 10 99Z" fill="${sole}"/>
<path d="M14 92C12 70 16 48 26 31C30 25 36 23 43 25L58 33C66 37 75 37 83 33L96 26C100 23 106 24 109 28L121 44C151 50 183 58 207 68C225 75 234 83 234 92Z" fill="${upper}"/>
<path d="M117 50l9-6M131 53l9-6M145 57l9-6" stroke="${detail}" stroke-width="3.2" stroke-linecap="round"/>
<path d="M22 72C70 70 130 72 214 78" stroke="${detail}" stroke-width="3" stroke-linecap="round" opacity=".55" fill="none"/>`;
    case 'loafer':
      return `<path d="M12 91H238V96C238 100 235 103 231 103H18C14 103 12 100 12 96Z" fill="${sole}"/>
<path d="M16 92C14 74 20 64 34 60C62 53 94 51 124 53C156 55 188 62 211 72C228 79 236 85 236 92Z" fill="${upper}"/>
<path d="M32 62C54 56 82 55 112 58C100 67 64 69 32 62Z" fill="${detail}" opacity=".7"/>
<path d="M126 57C142 59 158 63 172 69" stroke="${detail}" stroke-width="3.4" stroke-linecap="round" fill="none"/>`;
    case 'boot':
      return `<path d="M30 91H236V98C236 102 233 105 229 105H37C33 105 30 102 30 98Z" fill="${sole}"/>
<path d="M34 92V18C34 12 38 8 44 8H96C102 8 106 12 106 18V56C138 60 176 68 204 78C222 84 232 88 232 92Z" fill="${upper}"/>
<path d="M34 38H106" stroke="${detail}" stroke-width="3" opacity=".6"/>
<path d="M106 58C112 70 112 80 106 92" stroke="${detail}" stroke-width="3" opacity=".5" fill="none"/>`;
    default:
      return `<path d="M28 44C26 56 28 66 36 72L40 104H48L50 74C80 78 110 90 140 97H226C236 97 238 90 230 86C200 76 160 66 130 64C100 62 60 56 44 50C36 46 30 44 28 44Z" fill="${upper}"/>
<path d="M44 50C60 56 100 62 130 64C108 71 70 67 44 56Z" fill="${detail}" opacity=".55"/>
<path d="M142 97H226" stroke="${sole}" stroke-width="3" stroke-linecap="round"/>
<path d="M40 104H48" stroke="${sole}" stroke-width="3" stroke-linecap="round"/>`;
  }
}

const ART = {
  banner: svgUri(
    970,
    250,
    `<rect width="970" height="250" fill="#0875db"/>
<circle cx="776" cy="125" r="152" fill="#1a8cf5"/>
<g transform="translate(606 46) scale(1.42)">${shoe('sneaker', '#ffffff', '#c4e0fb', '#94c9fa')}</g>
<text x="56" y="96" ${FONT} font-size="38" font-weight="600" letter-spacing="-0.8" fill="#ffffff">Coleção Primavera-Verão</text>
<text x="56" y="130" ${FONT} font-size="17" fill="#dfeeff">Aurora Calçados · Francal 2026</text>
<rect x="56" y="160" width="172" height="40" rx="6" fill="#ffffff"/>
<text x="142" y="185.5" ${FONT} font-size="15" font-weight="600" fill="#0869c4" text-anchor="middle">Conheça a coleção</text>`,
  ),
  rectangle: svgUri(
    300,
    250,
    `<rect width="300" height="250" fill="#191d27"/>
<circle cx="204" cy="150" r="86" fill="#2c323e"/>
<g transform="translate(92 98) scale(0.8)">${shoe('sneaker', '#94c9fa', '#ffffff', '#4fa6f7')}</g>
<text x="24" y="46" ${FONT} font-size="22" font-weight="600" letter-spacing="-0.4" fill="#ffffff">Primavera-Verão</text>
<text x="24" y="68" ${FONT} font-size="13" fill="#9aa1ae">Aurora Calçados</text>
<rect x="24" y="200" width="104" height="28" rx="5" fill="#0875db"/>
<text x="76" y="218.5" ${FONT} font-size="12.5" font-weight="600" fill="#ffffff" text-anchor="middle">Conheça</text>`,
  ),
  square: svgUri(
    1080,
    1080,
    `<rect width="1080" height="1080" fill="#eef6ff"/>
<circle cx="560" cy="676" r="318" fill="#0875db"/>
<g transform="translate(196 520) scale(2.9)">${shoe('sneaker', '#ffffff', '#c4e0fb', '#94c9fa')}</g>
<text x="96" y="196" ${FONT} font-size="76" font-weight="600" letter-spacing="-1.6" fill="#141824">Coleção</text>
<text x="96" y="284" ${FONT} font-size="76" font-weight="600" letter-spacing="-1.6" fill="#141824">Primavera-Verão</text>
<text x="96" y="344" ${FONT} font-size="30" fill="#5a6272">Aurora Calçados · Francal 2026</text>`,
  ),
  leaderboard: svgUri(
    728,
    90,
    `<rect width="728" height="90" fill="#191d27"/>
<text x="28" y="53" ${FONT} font-size="24" font-weight="600" letter-spacing="-0.4" fill="#ffffff">Coleção Primavera-Verão</text>
<rect x="580" y="27" width="120" height="36" rx="5" fill="#0875db"/>
<text x="640" y="50" ${FONT} font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">Conheça</text>`,
  ),
  poster: svgUri(
    1280,
    720,
    `<rect width="1280" height="720" fill="#dfeeff"/>
<rect y="486" width="1280" height="234" fill="#c4e0fb"/>
<circle cx="952" cy="236" r="128" fill="#f5faff"/>
<g transform="translate(300 214) scale(3)">${shoe('sneaker', '#0875db', '#ffffff', '#4fa6f7')}</g>
<text x="80" y="118" ${FONT} font-size="44" font-weight="600" letter-spacing="-1" fill="#0a559c">Primavera-Verão 2027</text>
<text x="80" y="162" ${FONT} font-size="24" fill="#0869c4">Aurora Calçados</text>`,
  ),
  posterVitrine: svgUri(
    1280,
    720,
    `<rect width="1280" height="720" fill="#f1f3f6"/>
<rect y="500" width="1280" height="220" fill="#e3e6eb"/>
<g transform="translate(150 262) scale(2.2)">${shoe('loafer', '#8a5a3c', '#2c323e', '#5e3a24')}</g>
<g transform="translate(700 268) scale(2.2)">${shoe('boot', '#2c323e', '#191d27', '#5a6272')}</g>`,
  ),
};

type Product = {
  id: string;
  name: string;
  ref: string;
  kind: ShoeKind;
  color: string;
  sole: string;
  detail: string;
  bg: string;
};

const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Tênis Leve Aurora',
    ref: 'AU-2041',
    kind: 'sneaker',
    color: '#ffffff',
    sole: '#c0c6d0',
    detail: '#9aa1ae',
    bg: '#e3ecf7',
  },
  {
    id: 'p2',
    name: 'Mocassim Couro Nobre',
    ref: 'CN-1180',
    kind: 'loafer',
    color: '#8a5a3c',
    sole: '#2c323e',
    detail: '#5e3a24',
    bg: '#f1ece6',
  },
  {
    id: 'p3',
    name: 'Bota Pátio Couro',
    ref: 'PC-0932',
    kind: 'boot',
    color: '#2c323e',
    sole: '#191d27',
    detail: '#747c8b',
    bg: '#ebedf1',
  },
  {
    id: 'p4',
    name: 'Scarpin Lume',
    ref: 'LU-0415',
    kind: 'pump',
    color: '#c4553d',
    sole: '#191d27',
    detail: '#8f3420',
    bg: '#f6ebe7',
  },
  {
    id: 'p5',
    name: 'Tênis Bella Passo',
    ref: 'BP-2207',
    kind: 'sneaker',
    color: '#24426b',
    sole: '#ffffff',
    detail: '#94c9fa',
    bg: '#e6eef8',
  },
  {
    id: 'p6',
    name: 'Mocassim Ateliê Sul',
    ref: 'AS-0618',
    kind: 'loafer',
    color: '#6f7b4f',
    sole: '#3a4151',
    detail: '#4b5534',
    bg: '#eef0e8',
  },
];

/** Foto de produto 3:2 (de propósito fora de 4:3 e 1:1: “Preencher” corta, “Conter” mostra tudo). */
function productPhoto(product: Product) {
  return svgUri(
    900,
    600,
    `<rect width="900" height="600" fill="${product.bg}"/>
<rect y="436" width="900" height="164" fill="#000" opacity=".035"/>
<g transform="translate(166 196) scale(2.4)">${shoe(product.kind, product.color, product.sole, product.detail)}</g>`,
  );
}
const PHOTOS = Object.fromEntries(PRODUCTS.map((product) => [product.id, productPhoto(product)]));

const PORTRAITS = {
  'Rafael Dias': svgUri(
    96,
    96,
    `<rect width="96" height="96" fill="#cfe3f7"/>
<path d="M12 96c2-17 17-27 36-27s34 10 36 27z" fill="#0a559c"/>
<rect x="41" y="52" width="14" height="18" rx="6" fill="#c08562"/>
<ellipse cx="48" cy="41" rx="16.5" ry="19.5" fill="#d59d77"/>
<path d="M31 40c-1-14 7-23 18-23 11 0 18 8 17 21-4-7-10-10-18-10-8 0-13 5-17 12z" fill="#2c2420"/>`,
  ),
  'Clara Souto': svgUri(
    96,
    96,
    `<rect width="96" height="96" fill="#f3e6dc"/>
<path d="M27 40c0-16 9-25 21-25s21 9 21 25v30H27z" fill="#5b3a29"/>
<path d="M14 96c2-16 16-25 34-25s32 9 34 25z" fill="#2c323e"/>
<rect x="42" y="52" width="12" height="18" rx="5" fill="#dcae8c"/>
<ellipse cx="48" cy="42" rx="15.5" ry="18.5" fill="#e8bf9a"/>
<path d="M33 38c2-11 9-17 16-17 9 0 14 6 15 15-6-3-14-5-21-1-4 2-7 3-10 3z" fill="#5b3a29"/>`,
  ),
};

/* ——————————————————————————— Dados ——————————————————————————— */

const TEAM = [
  'Marina Lopes',
  'Rafael Dias',
  'Clara Souto',
  'Tiago Rezende',
  'Juliana Prates',
  'Bruno Teles',
];
const ADVERTISERS = [
  'Aurora Calçados',
  'Estúdio Norte',
  'Casa Forma',
  'Lume Acessórios',
  'Grupo Horizonte',
  'Ateliê Sul',
  'Pátio Couro',
  'Bella Passo',
  'Couro Nobre',
];

const accountMenu: MenuSection[] = [
  {
    items: [
      { label: 'Meu perfil', icon: UserRound },
      { label: 'Preferências', icon: Settings },
    ],
  },
  { items: [{ label: 'Sair', icon: LogOut }] },
];

const portals: Portal[] = [
  {
    id: 'francal',
    name: 'Francal 2026',
    detail: 'Portal do organizador',
    period: '06/07 – 09/07/2026',
  },
  {
    id: 'couromoda',
    name: 'Couromoda 2026',
    detail: 'Portal do organizador',
    period: '19/01 – 22/01/2026',
    status: 'archived',
  },
];

const noop = () => undefined;
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/* ——————————————————————————— Peças de prancha ——————————————————————————— */

function Panel({
  title,
  aside,
  children,
  className = '',
}: {
  title?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${x.panel} ${className}`}>
      {(title || aside) && (
        <header className={x.panelHead}>
          {title && <h4 className={x.panelTitle}>{title}</h4>}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

/* ——————————————————————————— Avatar ——————————————————————————— */

const history = [
  { who: 'Marina Lopes', what: 'iniciou a veiculação', when: '29/09 · 16:42' },
  { who: 'Rafael Dias', what: 'aprovou a campanha', when: '29/09 · 11:05' },
  { who: 'Clara Souto', what: 'gerou o P.I. 2026-0400', when: '28/09 · 18:20' },
];

const members: {
  name: string;
  mail: string;
  role: string;
  presence: 'online' | 'away' | 'offline';
}[] = [
  { name: 'Marina Lopes', mail: 'marina@francal.com.br', role: 'Operação', presence: 'online' },
  { name: 'Rafael Dias', mail: 'rafael@francal.com.br', role: 'Comercial', presence: 'away' },
  { name: 'Clara Souto', mail: 'clara@francal.com.br', role: 'Financeiro', presence: 'offline' },
];

function AvatarPage() {
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch">
        <div className={x.app}>
          <aside className={x.appSide}>
            <div className={x.appNav}>
              <SidebarItem
                item={{ id: 'cmp', label: 'Campanhas', icon: Megaphone, count: 5 }}
                active
              />
              <SidebarItem item={{ id: 'pi', label: 'Pedidos de Inserção', icon: FileText }} />
              <SidebarItem item={{ id: 'leads', label: 'Leads', icon: Users, count: 2 }} />
            </div>
            <div className={x.appAccount}>
              <SidebarAccount
                name="Marina Lopes"
                detail="Operação · Francal"
                sections={accountMenu}
              />
            </div>
          </aside>
          <div className={x.appMain}>
            <div className={x.appCol}>
              <Panel title="Equipe da campanha" aside={<LinkButton>Gerenciar</LinkButton>}>
                <div className={x.teamRow}>
                  <AvatarGroup
                    names={TEAM}
                    max={4}
                    size="md"
                    sources={PORTRAITS}
                    label="Equipe da campanha: 6 pessoas"
                  />
                </div>
              </Panel>
              <Panel title="Histórico">
                <ul className={x.history}>
                  {history.map((entry) => (
                    <li key={entry.what}>
                      <Avatar
                        name={entry.who}
                        src={PORTRAITS[entry.who as keyof typeof PORTRAITS]}
                        size="xs"
                        decorative
                      />
                      <span className={x.historyText}>
                        <span>
                          <strong>{entry.who}</strong> {entry.what}
                        </span>
                        <span className={x.meta}>{entry.when}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
            <div className={x.appCol}>
              <Panel title="Lead">
                <div className={x.person}>
                  <Avatar name="Juliana Prates" size="sm" decorative />
                  <span className={x.personText}>
                    <strong>Juliana Prates</strong>
                    <span className={x.meta}>Compradora · Bella Passo</span>
                  </span>
                  <span className={x.meta}>há 2 h</span>
                </div>
              </Panel>
              <Panel title="Membros" aside={<span className={x.meta}>3</span>}>
                <ul className={x.members}>
                  {members.map((member) => (
                    <li key={member.name}>
                      <Avatar
                        name={member.name}
                        src={PORTRAITS[member.name as keyof typeof PORTRAITS]}
                        size="md"
                        presence={member.presence}
                      />
                      <span className={x.personText}>
                        <strong>{member.name}</strong>
                        <span className={x.meta}>{member.mail}</span>
                      </span>
                      <span className={x.role}>{member.role}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        </div>
      </Shot>

      <Shot title="Tamanhos" tone="white" align="stretch" pad="md">
        <States columns={5} align="center">
          {(
            [
              ['xs', '20'],
              ['sm', '24'],
              ['md', '32'],
              ['lg', '40'],
              ['xl', '56'],
            ] as const
          ).map(([size, px]) => (
            <State key={size} label={`${size} · ${px}`}>
              <span className={x.pair}>
                <Avatar name="Marina Lopes" size={size} />
                <Avatar name="Rafael Dias" src={PORTRAITS['Rafael Dias']} size={size} />
              </span>
            </State>
          ))}
        </States>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch" pad="md">
        <div className={x.stack}>
          <States min={112} align="center">
            <State label="Orbe">
              <Avatar name="Tiago Rezende" size="xl" />
            </State>
            <State label="Foto">
              <Avatar name="Clara Souto" src={PORTRAITS['Clara Souto']} size="xl" />
            </State>
            <State label="Carregando">
              <Avatar
                name="Clara Souto"
                src={PORTRAITS['Clara Souto']}
                size="xl"
                imageState="loading"
              />
            </State>
            <State label="Erro → orbe">
              <Avatar
                name="Juliana Prates"
                src="data:image/png;base64,AAAA"
                size="xl"
                imageState="error"
              />
            </State>
            <State label="Disponível">
              <Avatar name="Marina Lopes" size="xl" presence="online" />
            </State>
            <State label="Ausente">
              <Avatar name="Rafael Dias" src={PORTRAITS['Rafael Dias']} size="xl" presence="away" />
            </State>
            <State label="Offline">
              <Avatar
                name="Clara Souto"
                src={PORTRAITS['Clara Souto']}
                size="xl"
                presence="offline"
              />
            </State>
          </States>
          <div className={x.statesGap} />
          <States min={180} align="center">
            <State label="Grupo">
              <AvatarGroup names={TEAM} max={4} size="md" sources={PORTRAITS} />
            </State>
            <State label="Membro em hover">
              <AvatarGroup names={TEAM} max={4} size="md" sources={PORTRAITS} hoverIndex={1} />
            </State>
            <State label="+2 em foco">
              <AvatarGroup names={TEAM} max={4} size="md" sources={PORTRAITS} moreForce="focus" />
            </State>
            <State label="Pequeno">
              <AvatarGroup names={TEAM.slice(0, 3)} size="xs" sources={PORTRAITS} />
            </State>
          </States>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Marca ——————————————————————————— */

function MarcaPage() {
  const [portal, setPortal] = useState('francal');
  return (
    <Shots>
      <Shot title="Assinatura" tone="white" align="stretch" pad="md">
        <div className={x.signature}>
          <div className={x.signatureMark}>
            <MediaOnMark />
          </div>
          <div className={x.pageEnd}>
            <div className={x.pageEndBody} aria-hidden="true">
              {[0, 1, 2, 3].map((key) => (
                <span key={key} className={x.ppCard}>
                  <i className={x.ppMedia} />
                  <i className={x.ppBar} style={{ width: '70%' }} />
                </span>
              ))}
            </div>
            <footer className={x.vitrineFoot}>
              <BrandLockup name="Francal 2026" detail="Vitrine de expositores" size="sm" />
              <MadeWith href="#marca" />
            </footer>
          </div>
        </div>
      </Shot>

      <Shot title="Portal" align="stretch">
        <div className={x.portalScene}>
          <div className={x.portalSide}>
            <PortalSwitcher portals={portals} value={portal} onChange={setPortal} />
          </div>
          <header className={x.vitrineHead}>
            <BrandLockup name="Francal 2026" cobrand />
            <nav className={x.vitrineNav} aria-label="Vitrine">
              <a href="#marca">Expositores</a>
              <a href="#marca">Lançamentos</a>
              <a href="#marca">Programação</a>
            </nav>
            <Button variant="primary" size="sm">
              Credenciamento
            </Button>
          </header>
        </div>
      </Shot>

      <Shot title="Mesma marca" align="stretch">
        <div className={x.sameGrid}>
          <Panel title="Campanhas" className={x.sameTable}>
            <div className={x.tableRow} data-head="">
              <span>Campanha</span>
              <span>Anunciante</span>
              <span className={x.num}>Verba</span>
            </div>
            <div className={x.tableRow}>
              <span className={x.cellMain}>
                <strong>Coleção Primavera-Verão no portal</strong>
                <span className={x.meta}>Banner Super Topo — Portal · #2041</span>
              </span>
              <span className={x.cellBrand}>
                <BrandMark name="Aurora Calçados" size="xs" variant="soft" decorative />
                Aurora Calçados
              </span>
              <span className={x.num}>R$ 18.000,00</span>
            </div>
          </Panel>
          <section className={x.drawer} aria-label="Lead Aurora Calçados">
            <header className={x.drawerHead}>
              <BrandMark name="Aurora Calçados" size="md" />
              <span className={x.personText}>
                <strong className={x.drawerTitle}>Aurora Calçados</strong>
                <span className={x.meta}>Lead · Expositor B-214</span>
              </span>
              <IconButton label="Fechar" icon={X} variant="ghost" size="sm" />
            </header>
            <dl className={x.drawerProps}>
              <div>
                <dt>Contato</dt>
                <dd>
                  <Avatar name="Juliana Prates" size="xs" decorative />
                  Juliana Prates
                </dd>
              </div>
              <div>
                <dt>Interesse</dt>
                <dd>Banner Super Topo — Portal</dd>
              </div>
            </dl>
          </section>
          <Panel title="Partes do P.I.">
            <dl className={x.parties}>
              <div>
                <dt>Contratante</dt>
                <dd>
                  <BrandMark name="Aurora Calçados" size="sm" decorative />
                  Aurora Calçados
                </dd>
              </div>
              <div>
                <dt>Veículo</dt>
                <dd>
                  <BrandMark name="Francal 2026" size="sm" decorative />
                  Francal 2026
                </dd>
              </div>
            </dl>
          </Panel>
        </div>
      </Shot>

      <Shot title="Organizações" tone="white" align="stretch" pad="md">
        <ul className={x.wall}>
          {ADVERTISERS.map((name) => (
            <li key={name}>
              <BrandMark name={name} size="lg" decorative />
              <span>{name}</span>
            </li>
          ))}
        </ul>
      </Shot>

      <Shot title="Variantes" tone="white" align="stretch" pad="md">
        <div className={x.stack}>
          <States columns={5} align="center">
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <State
                key={size}
                label={`${size} · ${{ xs: 20, sm: 24, md: 32, lg: 40, xl: 52 }[size]}`}
              >
                <BrandMark name="Aurora Calçados" size={size} />
              </State>
            ))}
          </States>
          <div className={x.statesGap} />
          <div className={x.variants}>
            <figure className={x.variant}>
              <div className={x.variantBody}>
                {ADVERTISERS.slice(0, 4).map((name) => (
                  <BrandMark key={name} name={name} size="md" variant="soft" />
                ))}
              </div>
              <figcaption>Suave</figcaption>
            </figure>
            <figure className={x.variant}>
              <div className={x.variantBody}>
                {ADVERTISERS.slice(0, 4).map((name) => (
                  <BrandMark key={name} name={name} size="md" />
                ))}
              </div>
              <figcaption>Sólida</figcaption>
            </figure>
            <figure className={x.variant}>
              <div className={x.variantBody} data-band="">
                {ADVERTISERS.slice(0, 4).map((name) => (
                  <BrandMark key={name} name={name} size="md" variant="paper" />
                ))}
              </div>
              <figcaption>Papel</figcaption>
            </figure>
          </div>
        </div>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch" pad="md">
        <States min={160} align="center">
          <State label="Repouso">
            <MadeWith href="#marca" />
          </State>
          <State label="Hover">
            <MadeWith href="#marca" data-force="hover" />
          </State>
          <State label="Foco">
            <MadeWith href="#marca" data-force="focus" />
          </State>
          <State label="Produto">
            <MediaOnMark tone="accent" size="sm" />
          </State>
          <State label="Sobre cor">
            <span className={x.onColor}>
              <MediaOnMark tone="paper" size="sm" />
            </span>
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Imagem ——————————————————————————— */

function PlacementMock() {
  return (
    <div
      className={x.portalPage}
      aria-label="Portal Francal 2026: posição do Banner Super Topo"
      role="img"
    >
      <div className={x.ppTop}>
        <BrandMark name="Francal 2026" size="xs" decorative />
        <i className={x.ppBar} style={{ width: 64 }} />
        <span className={x.ppNav}>
          <i className={x.ppBar} style={{ width: 36 }} />
          <i className={x.ppBar} style={{ width: 42 }} />
          <i className={x.ppBar} style={{ width: 30 }} />
        </span>
      </div>
      <div className={x.ppSlot}>
        <span className={x.ppTag}>Banner Super Topo</span>
        <MediaFrame ratio="970/250" src={ART.banner} alt="" radius="sm" />
      </div>
      <div className={x.ppGrid}>
        {[0, 1, 2, 3].map((key) => (
          <span key={key} className={x.ppCard}>
            <i className={x.ppMedia} />
            <i className={x.ppBar} style={{ width: '72%' }} />
            <i className={x.ppBar} style={{ width: '44%' }} />
          </span>
        ))}
      </div>
    </div>
  );
}

function ImagemPage() {
  const [fit, setFit] = useState<'cover' | 'contain'>('cover');
  const photo2 = PHOTOS.p2 ?? '';
  const photo4 = PHOTOS.p4 ?? '';
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch">
        <div className={x.imageScene}>
          <Panel
            title="Peça criativa"
            aside={<span className={x.meta}>Banner Super Topo — Portal</span>}
          >
            <MediaFrame
              ratio="970/250"
              src={ART.banner}
              alt="Peça Coleção Primavera-Verão, Aurora Calçados"
              caption="peca-970x250.png · 970 × 250 px · PNG"
            />
          </Panel>
          <div className={x.imageRow}>
            <Panel title="Posição no portal">
              <PlacementMock />
            </Panel>
            <Panel
              title="Vitrine"
              aside={
                <Segmented
                  label="Ajuste da foto"
                  size="sm"
                  value={fit}
                  onChange={setFit}
                  options={[
                    { value: 'cover', label: 'Preencher' },
                    { value: 'contain', label: 'Conter' },
                  ]}
                />
              }
            >
              <div className={x.photos}>
                <MediaFrame
                  ratio="4/3"
                  src={photo2}
                  alt="Mocassim Couro Nobre"
                  fit={fit}
                  caption="4:3"
                />
                <MediaFrame ratio="1/1" src={photo4} alt="Scarpin Lume" fit={fit} caption="1:1" />
              </div>
            </Panel>
          </div>
        </div>
      </Shot>

      <Shot title="Proporções" tone="white" align="stretch" pad="md">
        <div className={x.ratios}>
          <MediaFrame
            ratio="970/250"
            src={ART.banner}
            alt="Peça 970 × 250"
            caption="970 × 250"
            className={x.ratioWide}
          />
          <MediaFrame
            ratio="300/250"
            src={ART.rectangle}
            alt="Peça 300 × 250"
            caption="300 × 250"
            className={x.ratioItem}
          />
          <MediaFrame
            ratio="1/1"
            src={ART.square}
            alt="Peça 1080 × 1080"
            caption="1:1"
            className={x.ratioItem}
          />
          <MediaFrame
            ratio="4/3"
            src={PHOTOS.p1}
            alt="Tênis Leve Aurora"
            caption="4:3"
            className={x.ratioItem}
          />
          <MediaFrame
            ratio="16/9"
            src={ART.poster}
            alt="Pôster do teaser"
            caption="16:9"
            className={x.ratioItem}
          />
        </div>
      </Shot>

      <Shot title="Ajuste" tone="white" align="stretch" pad="md">
        <States columns={4}>
          <State label="Preencher · 1:1">
            <MediaFrame ratio="1/1" src={PHOTOS.p3} alt="Bota Pátio Couro" />
          </State>
          <State label="Conter · 1:1">
            <MediaFrame ratio="1/1" src={PHOTOS.p3} alt="Bota Pátio Couro" fit="contain" />
          </State>
          <State label="Preencher · 16:9">
            <MediaFrame ratio="16/9" src={PHOTOS.p6} alt="Mocassim Ateliê Sul" />
          </State>
          <State label="Conter · 16:9">
            <MediaFrame ratio="16/9" src={PHOTOS.p6} alt="Mocassim Ateliê Sul" fit="contain" />
          </State>
        </States>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch" pad="md">
        <States columns={3}>
          <State label="Carregando">
            <MediaFrame ratio="4/3" src={PHOTOS.p5} alt="Tênis Bella Passo" state="loading" />
          </State>
          <State label="Carregada">
            <MediaFrame ratio="4/3" src={PHOTOS.p5} alt="Tênis Bella Passo" />
          </State>
          <State label="Indisponível">
            <MediaFrame ratio="4/3" alt="Tênis Bella Passo" />
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Galeria ——————————————————————————— */

const PIECES: GalleryItem[] = [
  {
    id: 'g1',
    src: ART.banner,
    alt: 'Peça 970 × 250',
    ratio: '970/250',
    label: 'peca-970x250.png',
    meta: '970 × 250 px · PNG · 182 KB',
  },
  {
    id: 'g2',
    src: ART.rectangle,
    alt: 'Peça 300 × 250',
    ratio: '300/250',
    label: 'peca-300x250.png',
    meta: '300 × 250 px · PNG · 64 KB',
  },
  {
    id: 'g3',
    src: ART.square,
    alt: 'Peça 1080 × 1080',
    ratio: '1/1',
    label: 'post-1080x1080.png',
    meta: '1080 × 1080 px · PNG · 420 KB',
  },
];

function GaleriaPage() {
  const [index, setIndex] = useState(0);
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const [c, setC] = useState(2);
  const [d, setD] = useState(0);
  const [e, setE] = useState(1);
  return (
    <Shots>
      <Shot title="Peças da campanha" tone="white" align="stretch">
        <div className={x.galleryScene}>
          <Gallery
            items={PIECES}
            index={index}
            onIndexChange={setIndex}
            label="Peças da campanha"
            stageRatio="16/10"
          />
        </div>
      </Shot>

      <Shot title="Vitrine" tone="white" align="stretch" pad="md">
        <Carousel label="Lançamentos" title="Lançamentos">
          {PRODUCTS.map((product) => (
            <a key={product.id} href="#galeria" className={x.product}>
              <MediaFrame
                ratio="4/3"
                src={PHOTOS[product.id]}
                alt={product.name}
                className={x.productMedia}
              />
              <span className={x.productName}>{product.name}</span>
              <span className={x.meta}>Ref. {product.ref}</span>
            </a>
          ))}
        </Carousel>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch" pad="md">
        <States min={300}>
          <State label="Primeira">
            <Gallery
              items={PIECES}
              index={a}
              onIndexChange={setA}
              stageRatio="16/10"
              label="Primeira"
            />
          </State>
          <State label="Meio">
            <Gallery
              items={PIECES}
              index={b}
              onIndexChange={setB}
              stageRatio="16/10"
              label="Meio"
            />
          </State>
          <State label="Última">
            <Gallery
              items={PIECES}
              index={c}
              onIndexChange={setC}
              stageRatio="16/10"
              label="Última"
            />
          </State>
          <State label="Item único">
            <Gallery
              items={PIECES.slice(0, 1)}
              index={d}
              onIndexChange={setD}
              stageRatio="16/10"
              label="Item único"
            />
          </State>
          <State label="Miniatura em foco">
            <Gallery
              items={PIECES}
              index={e}
              onIndexChange={setE}
              stageRatio="16/10"
              label="Miniatura em foco"
              thumbForce={{ index: 1, state: 'focus' }}
            />
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Upload ——————————————————————————— */

const FORMAT = { w: 970, h: 250 };
const SPEC = 'PNG, JPG ou WEBP · 970 × 250 px · até 25 MB';

type Flow =
  | { step: 'idle' | 'over' }
  | {
      step: 'uploading';
      name: string;
      size: number;
      preview?: string;
      dims?: { w: number; h: number };
      progress: number;
    }
  | {
      step: 'done' | 'error';
      name: string;
      size: number;
      preview?: string;
      dims?: { w: number; h: number };
    };

function readDims(src: string) {
  return new Promise<{ w: number; h: number } | undefined>((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ w: image.naturalWidth, h: image.naturalHeight });
    image.onerror = () => resolve(undefined);
    image.src = src;
  });
}

function UploadFlow() {
  const [flow, setFlow] = useState<Flow>({ step: 'idle' });
  const [later, setLater] = useState(false);
  const [missing, setMissing] = useState(false);

  // Progresso simulado: passos de 9–15% a cada 140 ms; no fim confere as medidas.
  useEffect(() => {
    if (flow.step !== 'uploading') return;
    if (flow.progress >= 100) {
      const ok = !flow.dims || (flow.dims.w === FORMAT.w && flow.dims.h === FORMAT.h);
      const timer = window.setTimeout(() => setFlow({ ...flow, step: ok ? 'done' : 'error' }), 160);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(
      () =>
        setFlow({
          ...flow,
          progress: Math.min(100, flow.progress + 9 + ((flow.progress * 7) % 6)),
        }),
      140,
    );
    return () => window.clearTimeout(timer);
  }, [flow]);

  const start = (name: string, size: number, preview?: string, dims?: { w: number; h: number }) => {
    setMissing(false);
    setFlow({ step: 'uploading', name, size, preview, dims, progress: 0 });
  };
  const simulate = (good: boolean) =>
    good
      ? start('peca-970x250.png', 1_992_294, ART.banner, FORMAT)
      : start('peca-728x90.png', 640_000, ART.leaderboard, { w: 728, h: 90 });

  const take = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    const dims = preview ? await readDims(preview) : undefined;
    start(file.name, file.size, preview, dims);
  };

  const meta = (size: number, dims?: { w: number; h: number }) =>
    [dims ? `${dims.w} × ${dims.h} px` : undefined, formatBytes(size), 'PNG']
      .filter(Boolean)
      .join(' · ');

  let slot: ReactNode;
  if (later) {
    slot = <Dropzone spec={SPEC} format={FORMAT} onFiles={noop} disabled />;
  } else if (flow.step === 'idle' || flow.step === 'over') {
    slot = (
      <Dropzone
        accept="image/png,image/jpeg,image/webp"
        spec={SPEC}
        format={FORMAT}
        dragging={flow.step === 'over' || undefined}
        invalid={missing}
        error="Envie a peça criativa ou marque “Enviar depois”"
        onFiles={(files) => void take(files)}
      />
    );
  } else if (flow.step === 'uploading') {
    slot = (
      <FileRow
        name={flow.name}
        size={flow.size}
        status="uploading"
        progress={flow.progress}
        preview={flow.preview}
        format={flow.dims ?? FORMAT}
        onCancel={() => setFlow({ step: 'idle' })}
      />
    );
  } else if (flow.step === 'done' || flow.step === 'error') {
    const ok = flow.step === 'done';
    slot = (
      <FileRow
        name={flow.name}
        size={flow.size}
        status={flow.step}
        preview={flow.preview}
        format={flow.dims ?? FORMAT}
        meta={meta(flow.size, flow.dims)}
        message={
          ok
            ? 'Medidas conferem com o formato do ativo'
            : `Medidas ${flow.dims?.w ?? '?'} × ${flow.dims?.h ?? '?'} não conferem com 970 × 250`
        }
        onRetry={() => setFlow({ step: 'idle' })}
        onRemove={() => setFlow({ step: 'idle' })}
      />
    );
  }

  return (
    <div className={x.uploadScene}>
      <div className={x.simBar}>
        <ButtonGroup label="Simular">
          <Button
            size="sm"
            onClick={() => setFlow({ step: flow.step === 'over' ? 'idle' : 'over' })}
            disabled={later}
          >
            Arrastar
          </Button>
          <Button size="sm" onClick={() => simulate(true)} disabled={later}>
            Enviar
          </Button>
          <Button size="sm" onClick={() => simulate(false)} disabled={later}>
            Medidas erradas
          </Button>
          <Button
            size="sm"
            onClick={() => setMissing(true)}
            disabled={later || flow.step !== 'idle'}
          >
            Validar
          </Button>
        </ButtonGroup>
        <LinkButton
          onClick={() => {
            setFlow({ step: 'idle' });
            setLater(false);
            setMissing(false);
          }}
        >
          Reiniciar
        </LinkButton>
      </div>
      <Panel
        title="Briefing"
        aside={<span className={x.meta}>Banner Super Topo — Portal</span>}
        className={x.briefing}
      >
        <div className={x.field}>
          <span className={x.label}>
            Peça criativa <span aria-hidden="true">*</span>
          </span>
          {slot}
          <Checkbox
            label="Enviar depois da contratação"
            checked={later}
            disabled={flow.step === 'uploading'}
            onChange={(event) => {
              setMissing(false);
              setLater(event.target.checked);
            }}
          />
        </div>
      </Panel>
    </div>
  );
}

type PiFile = {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'done' | 'error';
  progress?: number;
  message?: string;
};

function PiAttachments() {
  const [files, setFiles] = useState<PiFile[]>([
    { id: 'a', name: 'P.I. 2026-0400 assinado.pdf', size: 186_368, status: 'done' },
    {
      id: 'b',
      name: 'comprovante-pagamento-setembro.pdf',
      size: 1_234_000,
      status: 'uploading',
      progress: 64,
    },
    {
      id: 'c',
      name: 'tabela-de-precos-francal-2026.xlsx',
      size: 31_457_280,
      status: 'error',
      message: 'Acima de 25 MB',
    },
  ]);
  const seq = useRef(0);
  const uploading = files.some((file) => file.status === 'uploading');
  useEffect(() => {
    if (!uploading) return;
    const timer = window.setTimeout(
      () =>
        setFiles((list) =>
          list.map((file) =>
            file.status === 'uploading'
              ? (file.progress ?? 0) >= 100
                ? { ...file, status: 'done', progress: undefined }
                : { ...file, progress: Math.min(100, (file.progress ?? 0) + 7) }
              : file,
          ),
        ),
      220,
    );
    return () => window.clearTimeout(timer);
  }, [files, uploading]);

  return (
    <div className={x.piUpload}>
      <Dropzone
        multiple
        accept=".pdf,.docx,.xlsx,.png,.jpg"
        spec="PDF, DOCX, XLSX ou imagem · até 25 MB cada"
        onFiles={(accepted, rejected) => {
          const next: PiFile[] = [
            ...accepted.map((file) => ({
              id: `n${(seq.current += 1)}`,
              name: file.name,
              size: file.size,
              status: 'uploading' as const,
              progress: 0,
            })),
            ...rejected.map(({ file, reason }) => ({
              id: `n${(seq.current += 1)}`,
              name: file.name,
              size: file.size,
              status: 'error' as const,
              message: reason === 'size' ? 'Acima de 25 MB' : 'Formato não aceito',
            })),
          ];
          setFiles((list) => [...list, ...next]);
        }}
      />
      <ul className={x.fileList}>
        {files.map((file) => (
          <li key={file.id}>
            <FileRow
              compact
              name={file.name}
              size={file.size}
              status={file.status}
              progress={file.progress}
              message={file.message}
              onCancel={() => setFiles((list) => list.filter((item) => item.id !== file.id))}
              onRemove={() => setFiles((list) => list.filter((item) => item.id !== file.id))}
              onRetry={
                file.status === 'error'
                  ? () => setFiles((list) => list.filter((item) => item.id !== file.id))
                  : undefined
              }
              retryLabel="Escolher outro"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function UploadPage() {
  return (
    <Shots>
      <Shot title="Briefing" align="stretch">
        <UploadFlow />
      </Shot>

      <Shot title="Anexos do P.I." tone="white" align="stretch" pad="md">
        <PiAttachments />
      </Shot>

      <Shot title="Estados" tone="white" align="stretch" pad="md">
        <States columns={1}>
          <State label="Repouso">
            <Dropzone spec={SPEC} format={FORMAT} onFiles={noop} />
          </State>
          <State label="Hover">
            <Dropzone spec={SPEC} format={FORMAT} onFiles={noop} force="hover" />
          </State>
          <State label="Arrastando">
            <Dropzone spec={SPEC} format={FORMAT} onFiles={noop} dragging />
          </State>
          <State label="Foco">
            <Dropzone spec={SPEC} format={FORMAT} onFiles={noop} force="focus" />
          </State>
          <State label="Inválido">
            <Dropzone
              spec={SPEC}
              format={FORMAT}
              onFiles={noop}
              invalid
              error="Envie a peça criativa ou marque “Enviar depois”"
            />
          </State>
          <State label="Enviando">
            <FileRow
              name="peca-970x250.png"
              size={1_992_294}
              status="uploading"
              progress={62}
              preview={ART.banner}
              format={FORMAT}
              onCancel={noop}
            />
          </State>
          <State label="Concluído">
            <FileRow
              name="peca-970x250.png"
              size={1_434}
              status="done"
              preview={ART.banner}
              format={FORMAT}
              meta="970 × 250 px · 1 KB · PNG"
              message="Medidas conferem com o formato do ativo"
              onRemove={noop}
            />
          </State>
          <State label="Erro">
            <FileRow
              name="peca-728x90.png"
              size={640_000}
              status="error"
              preview={ART.leaderboard}
              format={{ w: 728, h: 90 }}
              meta="728 × 90 px · 625 KB · PNG"
              message="Medidas 728 × 90 não conferem com 970 × 250"
              onRetry={noop}
              onRemove={noop}
            />
          </State>
          <State label="Indisponível">
            <Dropzone spec={SPEC} format={FORMAT} onFiles={noop} disabled />
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Anexo ——————————————————————————— */

const fileMenu = (onRemove: () => void): MenuSection[] => [
  { items: [{ label: 'Renomear', icon: Pencil }] },
  { items: [{ label: 'Excluir', icon: Trash2, danger: true, onSelect: onRemove }] },
];

function PiSheet({ page }: { page: number }) {
  const lines = (widths: number[]) =>
    widths.map((width, index) => (
      <i key={index} className={x.sheetLine} style={{ width: `${width}%` }} />
    ));
  if (page === 2) {
    return (
      <div className={x.sheet}>
        <span className={x.sheetSection}>Condições</span>
        <div className={x.sheetLines}>{lines([100, 96, 98, 72, 100, 94, 60])}</div>
        <span className={x.sheetSection}>Assinaturas</span>
        <div className={x.sheetSigns}>
          <span>
            <i />
            Aurora Calçados
          </span>
          <span>
            <i />
            Francal 2026
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className={x.sheet}>
      <div className={x.sheetHead}>
        <span className={x.sheetBrand}>
          <BrandMark name="Francal 2026" size="xs" decorative />
          Pedido de inserção
        </span>
        <span className={x.sheetNo}>P.I. 2026-0400</span>
      </div>
      <div className={x.sheetLines}>{lines([62, 48])}</div>
      <div className={x.sheetTable}>
        {[
          ['Banner Super Topo — Portal', 'R$ 18.000,00'],
          ['Período', '01/10 – 31/10'],
          ['Impressões', '≈ 400.000'],
        ].map(([label, value]) => (
          <span key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </span>
        ))}
      </div>
      <div className={x.sheetLines}>{lines([100, 92, 97, 64])}</div>
      <div className={x.sheetTotal}>
        <span>Total</span>
        <strong>R$ 18.000,00</strong>
      </div>
    </div>
  );
}

function AnexoPage() {
  const [preview, setPreview] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(['pi', 'brief', 'peca']);
  const [chips, setChips] = useState([
    { id: 'c1', name: 'peca-970x250.png', size: 98_304, progress: undefined as number | undefined },
    {
      id: 'c2',
      name: 'briefing-colecao-primavera-verao-final.docx',
      size: 24_576,
      progress: undefined as number | undefined,
    },
    { id: 'c3', name: 'P.I. 2026-0400.pdf', size: 186_368, progress: 40 as number | undefined },
  ]);
  const sending = chips.some((chip) => chip.progress !== undefined);
  useEffect(() => {
    if (!sending) return;
    const timer = window.setTimeout(
      () =>
        setChips((list) =>
          list.map((chip) =>
            chip.progress === undefined
              ? chip
              : {
                  ...chip,
                  progress: chip.progress >= 100 ? undefined : Math.min(100, chip.progress + 6),
                },
          ),
        ),
      200,
    );
    return () => window.clearTimeout(timer);
  }, [chips, sending]);

  const remove = (id: string) => setRows((list) => list.filter((row) => row !== id));
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch">
        <div className={x.attachScene}>
          <Panel title="Anexos" aside={<span className={x.meta}>{rows.length}</span>}>
            <div className={x.attachList}>
              {rows.includes('pi') && (
                <AttachmentRow
                  name="P.I. 2026-0400.pdf"
                  size={186_368}
                  onPreview={() => {
                    setPage(1);
                    setPreview(true);
                  }}
                  onDownload={() => wait(900)}
                  menu={fileMenu(() => remove('pi'))}
                />
              )}
              {rows.includes('brief') && (
                <AttachmentRow
                  name="briefing-aurora.docx"
                  size={24_576}
                  onPreview={noop}
                  onDownload={() => wait(700)}
                  menu={fileMenu(() => remove('brief'))}
                />
              )}
              {rows.includes('peca') && (
                <AttachmentRow
                  name="peca-970x250.png"
                  size={98_304}
                  preview={ART.banner}
                  onPreview={noop}
                  onDownload={() => wait(700)}
                  menu={fileMenu(() => remove('peca'))}
                />
              )}
              <AttachmentRow name="peca-v1-rascunho.png" size={88_000} status="missing" />
            </div>
          </Panel>
          <Panel title="Mensagem para Aurora Calçados">
            <div className={x.composer}>
              <textarea
                className={x.composerInput}
                rows={3}
                aria-label="Mensagem"
                defaultValue="Segue a peça aprovada e o P.I. para assinatura."
              />
              <div className={x.chips}>
                {chips.map((chip) => (
                  <AttachmentChip
                    key={chip.id}
                    name={chip.name}
                    size={chip.size}
                    progress={chip.progress}
                    onRemove={() => setChips((list) => list.filter((item) => item.id !== chip.id))}
                  />
                ))}
              </div>
              <div className={x.composerBar}>
                <Button variant="ghost" size="sm" icon={Paperclip}>
                  Anexar
                </Button>
                <Button variant="primary" size="sm" icon={Send} disabled={sending}>
                  Enviar
                </Button>
              </div>
            </div>
          </Panel>
        </div>
        <AttachmentPreview
          open={preview}
          onClose={() => setPreview(false)}
          name="P.I. 2026-0400.pdf"
          meta="182 KB · PDF"
          pages={2}
          page={page}
          onPageChange={setPage}
          onDownload={() => setPreview(false)}
        >
          {(current) => <PiSheet page={current} />}
        </AttachmentPreview>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch" pad="md">
        <div className={x.stack}>
          <States min={300}>
            <State label="Repouso">
              <AttachmentRow
                name="P.I. 2026-0400.pdf"
                size={186_368}
                onPreview={noop}
                onDownload={noop}
                menu={fileMenu(noop)}
              />
            </State>
            <State label="Hover">
              <AttachmentRow
                name="P.I. 2026-0400.pdf"
                size={186_368}
                onPreview={noop}
                onDownload={noop}
                menu={fileMenu(noop)}
                force="hover"
              />
            </State>
            <State label="Foco">
              <AttachmentRow
                name="P.I. 2026-0400.pdf"
                size={186_368}
                onPreview={noop}
                onDownload={noop}
                menu={fileMenu(noop)}
                force="focus"
              />
            </State>
            <State label="Baixando">
              <AttachmentRow
                name="P.I. 2026-0400.pdf"
                size={186_368}
                onPreview={noop}
                status="downloading"
                menu={fileMenu(noop)}
              />
            </State>
            <State label="Concluído">
              <AttachmentRow
                name="P.I. 2026-0400.pdf"
                size={186_368}
                onPreview={noop}
                status="done"
                menu={fileMenu(noop)}
              />
            </State>
            <State label="Removido">
              <AttachmentRow name="P.I. 2026-0400.pdf" size={186_368} status="missing" />
            </State>
          </States>
          <div className={x.statesGap} />
          <States min={220}>
            <State label="Chip">
              <AttachmentChip name="briefing-aurora.docx" size={24_576} onRemove={noop} />
            </State>
            <State label="Chip em hover">
              <AttachmentChip
                name="briefing-aurora.docx"
                size={24_576}
                onRemove={noop}
                force="hover"
              />
            </State>
            <State label="Enviando">
              <AttachmentChip
                name="P.I. 2026-0400.pdf"
                size={186_368}
                progress={46}
                onRemove={noop}
              />
            </State>
            <State label="Nome longo">
              <AttachmentChip
                name="briefing-colecao-primavera-verao-final.docx"
                size={24_576}
                onRemove={noop}
              />
            </State>
          </States>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Vídeo ——————————————————————————— */

const CUES: VideoCue[] = [
  { from: 0, to: 4, text: 'Nova coleção Primavera-Verão' },
  { from: 4, to: 9, text: 'Couro leve, cores claras' },
  { from: 9, to: 15, text: 'Aurora Calçados · Francal 2026' },
];

function VideoPage() {
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch">
        <div className={x.videoScene}>
          <Panel title="Briefing" aside={<span className={x.meta}>Push no app da feira</span>}>
            <div className={x.field}>
              <span className={x.label}>Vídeo da campanha</span>
              <VideoPlayer
                poster={ART.poster}
                title="Teaser Coleção Primavera"
                duration={15}
                captions={CUES}
              />
              <span className={x.meta}>teaser-primavera.mp4 · 0:15 · 4,8 MB</span>
            </div>
          </Panel>
          <section className={x.vitrineBlock}>
            <VideoPlayer poster={ART.posterVitrine} title="Lançamentos Couro Nobre" duration={42} />
            <div className={x.vitrineCaption}>
              <span className={x.cellBrand}>
                <BrandMark name="Couro Nobre" size="xs" variant="soft" decorative />
                Couro Nobre
              </span>
              <strong className={x.vitrineTitle}>Lançamentos Outono-Inverno</strong>
              <span className={x.meta}>Estande C-118 · Pavilhão Azul</span>
            </div>
          </section>
        </div>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch" pad="md">
        <States min={300}>
          <State label="Pôster">
            <VideoPlayer
              poster={ART.poster}
              title="Teaser Coleção Primavera"
              duration={15}
              state="poster"
            />
          </State>
          <State label="Tocando">
            <VideoPlayer
              poster={ART.poster}
              title="Teaser Coleção Primavera"
              duration={15}
              state="playing"
              time={4}
            />
          </State>
          <State label="Pausado">
            <VideoPlayer
              poster={ART.poster}
              title="Teaser Coleção Primavera"
              duration={15}
              state="paused"
              time={9}
            />
          </State>
          <State label="Carregando">
            <VideoPlayer
              poster={ART.poster}
              title="Teaser Coleção Primavera"
              duration={15}
              state="loading"
              time={2}
            />
          </State>
          <State label="Fim">
            <VideoPlayer
              poster={ART.poster}
              title="Teaser Coleção Primavera"
              duration={15}
              state="ended"
            />
          </State>
          <State label="Erro">
            <VideoPlayer
              poster={ART.poster}
              title="Teaser Coleção Primavera"
              duration={15}
              state="error"
            />
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

export const specimens: Record<string, ComponentType> = {
  avatar: AvatarPage,
  marca: MarcaPage,
  imagem: ImagemPage,
  galeria: GaleriaPage,
  upload: UploadPage,
  anexo: AnexoPage,
  video: VideoPage,
};
