'use client';

/*
 * A página do expositor (Vitrine) desenhada dentro do editor: 12 tipos de seção, 2–3 layouts cada,
 * composição por tela (desktop · tablet · celular). Todo texto é editável no lugar (contentEditable)
 * quando a seção está selecionada; imagens marcam `data-img` para o editor selecionar.
 * Cor, tipografia, cantos e botões vêm do tema por variáveis (--brand, --head-font, --r-btn…).
 */

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Factory,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Menu,
  Package,
  Phone,
  Plus,
  Quote,
  Sparkle,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import {
  createElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type CSSProperties,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { Avatar, BrandMark, MadeWith } from '@mediaon/design-system/v3';
import { Art, FloorPlan } from './page-builder-art';
import {
  type Img,
  type Screen,
  type Section,
  type Theme,
  cleanHtml,
  contrast,
  productsFor,
  readPath,
} from './page-builder-data';
import st from './page-builder-site.module.css';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const brl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

export type SiteApi = {
  /** Seção selecionada (e fora da prévia): textos viram editáveis. */
  editable: boolean;
  onText: (path: string, html: string) => void;
  onTextFocus: (el: HTMLElement, path: string) => void;
  onTextBlur: (event: FocusEvent<HTMLElement>) => void;
};

/** Variáveis do tema aplicadas na raiz da página. */
export function themeVars(theme: Theme): CSSProperties {
  const onWhite = contrast(theme.brand, '#FFFFFF');
  return {
    '--brand': theme.brand,
    '--brand-ink': onWhite >= 3 ? '#FFFFFF' : '#191D27',
    '--brand-text': onWhite >= 4.5 ? theme.brand : `color-mix(in srgb, ${theme.brand} 62%, #000)`,
  } as CSSProperties;
}

/* ——— Texto editável no lugar ——— */

type Tag = 'span' | 'strong' | 'p' | 'h1' | 'h2' | 'h3' | 'div';

/**
 * Texto da seção. React escreve o HTML só na montagem; mudanças de fora (painel, desfazer) entram
 * pelo efeito, e a digitação nunca é reescrita (o cursor não pula). Enter e Escape encerram a edição.
 */
export function T({
  s,
  path,
  as = 'span',
  className,
  api,
  label,
}: {
  s: Section;
  path: string;
  as?: Tag;
  className?: string;
  api: SiteApi;
  label?: string;
}) {
  const value = readPath(s, path);
  const ref = useRef<HTMLElement>(null);
  const [initial] = useState(value);
  const local = useRef(value);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || value === local.current) return;
    local.current = value;
    if (el.innerHTML !== value) el.innerHTML = value;
  }, [value]);
  const editable = api.editable;
  return createElement(as, {
    ref,
    className: `${st.text} ${className ?? ''}`,
    'data-edit': path,
    contentEditable: editable ? true : undefined,
    suppressContentEditableWarning: true,
    spellCheck: false,
    role: editable ? 'textbox' : undefined,
    'aria-label': editable ? (label ?? 'Texto') : undefined,
    'aria-multiline': editable ? false : undefined,
    dangerouslySetInnerHTML: { __html: initial },
    onInput: (event: FormEvent<HTMLElement>) => {
      const html = cleanHtml(event.currentTarget.innerHTML);
      local.current = html;
      api.onText(path, html);
    },
    onFocus: (event: FocusEvent<HTMLElement>) => api.onTextFocus(event.currentTarget, path),
    onBlur: api.onTextBlur,
    onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
      if (event.key === 'Enter' || event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.blur();
      }
    },
    onPaste: (event: ReactClipboardEvent<HTMLElement>) => {
      event.preventDefault();
      const text = event.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text.replace(/\s+/g, ' '));
    },
  });
}

/* ——— Peças ——— */

function SiteLogo() {
  return (
    <span className={st.logo} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="7.6" cy="12" r="3.1" fill="currentColor" />
        <path d="M13 7.4a6.6 6.6 0 0 1 0 9.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M16.6 4.4a11 11 0 0 1 0 15.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
      </svg>
    </span>
  );
}

export function ImageView({ img }: { img: Img }) {
  if (img.src)
    // eslint-disable-next-line @next/next/no-img-element -- imagem enviada pela pessoa (URL local do navegador)
    return <img src={img.src} alt={img.alt} className={st.photo} data-fit={img.fit} draggable={false} />;
  return <Art id={img.art} fit={img.fit} label={img.alt} />;
}

function Figure({ s, index, className }: { s: Section; index: number; className?: string }) {
  const img = s.images[index];
  if (!img) return null;
  return (
    <div className={`${st.figure} ${className ?? ''}`} data-img={index}>
      <ImageView img={img} />
    </div>
  );
}

function Btn({ s, path, api, kind = 'primary', icon: Icon, label }: { s: Section; path: string; api: SiteApi; kind?: 'primary' | 'secondary'; icon?: LucideIcon; label: string }) {
  return (
    <span className={st.btn} data-kind={kind}>
      <T s={s} path={path} api={api} label={label} />
      {Icon && <Icon aria-hidden="true" />}
    </span>
  );
}

function Head({ s, api, children, action }: { s: Section; api: SiteApi; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className={st.head}>
      <div className={st.headText}>
        <T s={s} path="text.title" as="h2" className={st.h2} api={api} label="Título" />
        {children}
      </div>
      {action}
    </div>
  );
}

const HIGHLIGHT_ICONS: LucideIcon[] = [Factory, Package, Truck];

/* ——— Seções ——— */

function Header({ s, api, screen }: { s: Section; api: SiteApi; screen: Screen }) {
  const nav = s.flags.menu && screen !== 'mobile';
  return (
    <div className={`${st.inner} ${st.header}`}>
      <span className={st.brand}>
        <SiteLogo />
        <T s={s} path="text.brand" as="strong" className={st.brandName} api={api} label="Nome da marca" />
      </span>
      {nav && (
        <span className={st.nav} aria-hidden="true">
          <span>Coleção</span>
          <span>Programação</span>
          <span>Estande</span>
          <span>Contato</span>
        </span>
      )}
      {screen === 'mobile' ? (
        <span className={st.menuIcon} aria-hidden="true">
          <Menu />
        </span>
      ) : (
        <span className={st.headerCta}>
          <Btn s={s} path="text.cta" api={api} label="Botão" />
        </span>
      )}
    </div>
  );
}

function Hero({ s, api }: { s: Section; api: SiteApi }) {
  const text = (
    <div className={st.heroText}>
      <span className={st.eyebrow}>
        <MapPin aria-hidden="true" />
        <T s={s} path="text.eyebrow" api={api} label="Selo" />
      </span>
      <T s={s} path="text.title" as="h1" className={st.h1} api={api} label="Título" />
      <T s={s} path="text.subtitle" as="p" className={st.lead} api={api} label="Texto" />
      <div className={st.actions}>
        <Btn s={s} path="text.cta1" api={api} label="Botão principal" />
        <Btn s={s} path="text.cta2" api={api} kind="secondary" label="Botão secundário" />
      </div>
    </div>
  );
  if (s.layout === 'fundo')
    return (
      <>
        <Figure s={s} index={0} className={st.heroBackdrop} />
        <div className={`${st.inner} ${st.heroOver}`}>
          <div className={st.heroCard}>{text}</div>
        </div>
      </>
    );
  return (
    <div className={`${st.inner} ${st.hero}`}>
      {text}
      <Figure s={s} index={0} className={st.heroImg} />
    </div>
  );
}

function Highlights({ s, api }: { s: Section; api: SiteApi }) {
  return (
    <div className={st.inner}>
      <Head s={s} api={api} />
      <div className={st.highlights}>
        {s.items.map((item, index) => {
          const Icon = HIGHLIGHT_ICONS[index] ?? Sparkle;
          return (
            <div key={index} className={st.highlight}>
              {s.layout === 'numeros' ? (
                <T s={s} path={`items.${index}.value`} as="strong" className={st.figureValue} api={api} label="Número" />
              ) : (
                <span className={st.iconChip} aria-hidden="true">
                  <Icon />
                </span>
              )}
              <div className={st.highlightText}>
                <T s={s} path={`items.${index}.title`} as="h3" className={st.h3} api={api} label="Título do destaque" />
                <T s={s} path={`items.${index}.text`} as="p" className={st.p} api={api} label="Texto do destaque" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Products({ s, api }: { s: Section; api: SiteApi }) {
  const list = productsFor(s.opts.collection ?? 'lancamentos');
  const count = s.layout === 'destaque' ? 5 : Number(s.opts.count ?? 6);
  const shown = list.slice(0, count);
  return (
    <div className={st.inner}>
      <Head
        s={s}
        api={api}
        action={
          s.layout === 'carrossel' ? (
            <span className={st.arrows} aria-hidden="true">
              <span>
                <ChevronLeft />
              </span>
              <span>
                <ChevronRight />
              </span>
            </span>
          ) : (
            <span className={st.link}>
              <T s={s} path="text.link" api={api} label="Link" />
              <ArrowRight aria-hidden="true" />
            </span>
          )
        }
      />
      <div className={st.products} data-count={shown.length}>
        {shown.map((product, index) => (
          <div key={`${product.name}-${index}`} className={st.product} data-flip={product.name}>
            <span className={st.productImg}>
              <Art id={product.art} />
              {s.flags.badge && product.isNew && <span className={st.badge}>Novo</span>}
            </span>
            <span className={st.productName}>{product.name}</span>
            {s.flags.price && <span className={st.price}>{brl(product.price)}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Schedule({ s, api }: { s: Section; api: SiteApi }) {
  return (
    <div className={st.inner}>
      <Head s={s} api={api}>
        <T s={s} path="text.subtitle" as="p" className={st.sub} api={api} label="Subtítulo" />
      </Head>
      <div className={st.events}>
        {s.items.map((item, index) => (
          <div key={index} className={st.event}>
            <span className={st.date}>
              <strong>{item.day}</strong>
              <span>{item.month}</span>
            </span>
            <span className={st.time}>
              <Clock aria-hidden="true" />
              <T s={s} path={`items.${index}.time`} api={api} label="Horário" />
            </span>
            <T s={s} path={`items.${index}.title`} as="h3" className={`${st.h3} ${st.eventTitle}`} api={api} label="Atividade" />
            {s.flags.place && (
              <span className={st.place}>
                <MapPin aria-hidden="true" />
                <T s={s} path={`items.${index}.place`} api={api} label="Local" />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function GallerySection({ s, api }: { s: Section; api: SiteApi }) {
  return (
    <div className={st.inner}>
      <Head s={s} api={api} />
      <div className={st.gallery}>
        {s.images.map((_img, index) => (
          <Figure key={index} s={s} index={index} className={st.galleryItem} />
        ))}
      </div>
    </div>
  );
}

function Testimonials({ s, api }: { s: Section; api: SiteApi }) {
  const items = s.layout === 'destaque' ? s.items.slice(0, 1) : s.items;
  return (
    <div className={st.inner}>
      {s.layout !== 'destaque' && <Head s={s} api={api} />}
      <div className={st.quotes}>
        {items.map((item, index) => (
          <figure key={index} className={st.quote}>
            <Quote className={st.quoteMark} aria-hidden="true" />
            <T s={s} path={`items.${index}.quote`} as="p" className={st.quoteText} api={api} label="Depoimento" />
            <figcaption className={st.person}>
              <Avatar name={item.name ?? ''} size="sm" decorative />
              <span>
                <T s={s} path={`items.${index}.name`} as="strong" api={api} label="Nome" />
                <T s={s} path={`items.${index}.role`} api={api} label="Loja" />
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function Partners({ s, api }: { s: Section; api: SiteApi }) {
  return (
    <div className={st.inner}>
      <T s={s} path="text.title" as="h2" className={st.kicker} api={api} label="Título" />
      <div className={st.partners}>
        {s.items.map((item, index) => (
          <span key={index} className={st.partner}>
            <BrandMark name={item.name ?? ''} size="xs" decorative />
            <T s={s} path={`items.${index}.name`} api={api} label="Parceiro" />
          </span>
        ))}
      </div>
    </div>
  );
}

function MapSection({ s, api }: { s: Section; api: SiteApi }) {
  return (
    <div className={`${st.inner} ${st.map}`}>
      <div className={st.mapArt}>
        <FloorPlan />
      </div>
      <div className={st.mapInfo}>
        <T s={s} path="text.title" as="h2" className={st.h2} api={api} label="Título" />
        <span className={st.infoRow} data-strong="">
          <MapPin aria-hidden="true" />
          <T s={s} path="text.subtitle" api={api} label="Local" />
        </span>
        <span className={st.infoRow}>
          <Factory aria-hidden="true" />
          <T s={s} path="text.address" api={api} label="Endereço" />
        </span>
        <span className={st.infoRow}>
          <Clock aria-hidden="true" />
          <T s={s} path="text.hours" api={api} label="Horário" />
        </span>
        <div className={st.actions}>
          <Btn s={s} path="text.cta" api={api} kind="secondary" icon={ArrowRight} label="Botão" />
        </div>
      </div>
    </div>
  );
}

function Faq({ s, api }: { s: Section; api: SiteApi }) {
  return (
    <div className={st.inner}>
      <Head s={s} api={api} />
      <div className={st.faq}>
        {s.items.map((_item, index) => {
          const open = s.layout === 'colunas' || (s.flags.first && index === 0);
          return (
            <div key={index} className={st.faqItem} data-open={open || undefined}>
              <div className={st.faqQ}>
                <T s={s} path={`items.${index}.q`} as="h3" className={st.h3} api={api} label="Pergunta" />
                {s.layout !== 'colunas' && (open ? <ChevronDown aria-hidden="true" /> : <Plus aria-hidden="true" />)}
              </div>
              {open && <T s={s} path={`items.${index}.a`} as="p" className={st.p} api={api} label="Resposta" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContactSection({ s, api }: { s: Section; api: SiteApi }) {
  const info = (
    <>
      <T s={s} path="text.title" as="h2" className={st.h2} api={api} label="Título" />
      <T s={s} path="text.subtitle" as="p" className={st.lead} api={api} label="Texto" />
      <span className={st.contactLine}>
        <span className={st.infoRow}>
          <Mail aria-hidden="true" />
          <T s={s} path="text.email" api={api} label="E-mail" />
        </span>
        <span className={st.infoRow}>
          <Phone aria-hidden="true" />
          <T s={s} path="text.phone" api={api} label="Telefone" />
        </span>
      </span>
    </>
  );
  if (s.layout === 'formulario')
    return (
      <div className={`${st.inner} ${st.contactForm}`}>
        <div className={st.contactText}>{info}</div>
        <div className={st.form} aria-hidden="true">
          <span className={st.formField}>
            <span>Nome</span>
            <i />
          </span>
          <span className={st.formField}>
            <span>E-mail</span>
            <i />
          </span>
          <span className={st.formField}>
            <span>Loja</span>
            <i />
          </span>
          <span className={st.formField} data-tall="">
            <span>Mensagem</span>
            <i />
          </span>
          <span className={st.btn} data-kind="primary" data-full="">
            {readPath(s, 'text.cta').replace(/<[^>]*>/g, '')}
          </span>
        </div>
      </div>
    );
  return (
    <div className={`${st.inner} ${st.contactBand}`}>
      <div className={st.contactText}>{info}</div>
      <div className={st.actions}>
        <Btn s={s} path="text.cta" api={api} icon={ArrowRight} label="Botão" />
      </div>
    </div>
  );
}

function Footer({ s, api }: { s: Section; api: SiteApi }) {
  const brand = (
    <span className={st.brand}>
      <SiteLogo />
      <T s={s} path="text.brand" as="strong" className={st.brandName} api={api} label="Nome da marca" />
    </span>
  );
  const social = (
    <span className={st.social} aria-hidden="true">
      <Instagram />
      <Linkedin />
    </span>
  );
  const made = s.flags.madeWith ? <MadeWith className={st.made} tabIndex={-1} /> : null;
  if (s.layout === 'colunas')
    return (
      <div className={st.inner}>
        <div className={st.footCols}>
          <div className={st.footBrand}>
            {brand}
            <p className={st.p}>Calçados femininos em couro vegetal, feitos em Franca desde 1998.</p>
            {social}
          </div>
          {[
            ['Coleção', 'Scarpins', 'Mules', 'Bolsas'],
            ['Atendimento', 'Representantes', 'Trocas', 'Contato'],
            ['Francal 2026', 'Estande B-214', 'Programação', 'Mapa'],
          ].map(([title, ...links]) => (
            <div key={title} className={st.footCol} aria-hidden="true">
              <strong>{title}</strong>
              {links.map((link) => (
                <span key={link}>{link}</span>
              ))}
            </div>
          ))}
        </div>
        <div className={st.footBar}>
          <T s={s} path="text.note" className={st.note} api={api} label="Assinatura" />
          {made}
        </div>
      </div>
    );
  return (
    <div className={`${st.inner} ${st.footSimple}`}>
      {brand}
      <T s={s} path="text.note" className={st.note} api={api} label="Assinatura" />
      <span className={st.footEnd}>
        {social}
        {made}
      </span>
    </div>
  );
}

/** Conteúdo de uma seção (sem a moldura do editor). */
export function SectionBody({ s, api, screen }: { s: Section; api: SiteApi; screen: Screen }) {
  switch (s.kind) {
    case 'cabecalho':
      return <Header s={s} api={api} screen={screen} />;
    case 'hero':
      return <Hero s={s} api={api} />;
    case 'destaques':
      return <Highlights s={s} api={api} />;
    case 'produtos':
      return <Products s={s} api={api} />;
    case 'programacao':
      return <Schedule s={s} api={api} />;
    case 'galeria':
      return <GallerySection s={s} api={api} />;
    case 'depoimentos':
      return <Testimonials s={s} api={api} />;
    case 'marcas':
      return <Partners s={s} api={api} />;
    case 'mapa':
      return <MapSection s={s} api={api} />;
    case 'faq':
      return <Faq s={s} api={api} />;
    case 'contato':
      return <ContactSection s={s} api={api} />;
    default:
      return <Footer s={s} api={api} />;
  }
}

/** Fundo “Imagem” da seção: arte cobrindo, com véu claro chapado para o texto. */
export function SectionBackdrop({ s }: { s: Section }) {
  if (s.bg !== 'imagem' || (s.kind === 'hero' && s.layout === 'fundo')) return null;
  return (
    <span className={st.backdrop} aria-hidden="true">
      <Art id={s.bgArt} />
      <i />
    </span>
  );
}

export const siteStyles = st;
