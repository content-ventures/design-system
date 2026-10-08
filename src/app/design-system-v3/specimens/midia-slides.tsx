'use client';

import { useState, useSyncExternalStore, type ComponentType } from 'react';
import { Field, Input, Textarea } from '@content-ventures/design-system/v3/fields';
import { BrandMark } from '@content-ventures/design-system/v3/identity';
import { Segmented } from '@content-ventures/design-system/v3/selection';
import {
  SLIDE_SLOT_LABELS,
  SlideCanvas,
  slideOverflowMessage,
  slideSlots,
  type SlideContent,
  type SlideLayout,
  type SlideOverflow,
  type SlideSlot,
  type SlideTheme,
} from '@content-ventures/design-system/v3/slide-canvas';
import { SlideStrip, type SlideStripItem } from '@content-ventures/design-system/v3/slide-strip';
import { Phone, Shot, Shots, State, States } from '../stage';
import x from './midia-slides.module.css';

/*
 * Slides (mídia): `SlideStrip` + `SlideCanvas`. Reporter IA — Marina Lopes transformou a entrevista
 * com Rafael Dias em reportagem; o carrossel sai da versão aprovada em 5 slides:
 * Capa · Contexto · Ponto principal · Citação · Conclusão. Modelo neutro provisório.
 */

type Ratio = '4/5' | '1/1';
type Slide = {
  id: string;
  name: string;
  layout: SlideLayout;
  theme: SlideTheme;
  content: SlideContent;
};

const FOOTER = 'Portal Horizonte';
const brand = <BrandMark name="Portal Horizonte" size="xs" decorative />;

const SLIDES: Slide[] = [
  {
    id: 'capa',
    name: 'Capa',
    layout: 'cover',
    theme: 'accent',
    content: {
      eyebrow: 'Tecnologia',
      title: 'Como a IA já muda a rotina das redações',
      body: 'Ferramentas transcrevem e resumem. A apuração continua humana.',
      footer: FOOTER,
    },
  },
  {
    id: 'contexto',
    name: 'Contexto',
    layout: 'text',
    theme: 'light',
    content: {
      eyebrow: 'Contexto',
      // Longo de propósito: passa das 2 linhas do layout e acende o aviso.
      title: 'Seis em cada dez redações brasileiras já testam inteligência artificial no dia a dia',
      body: 'Levantamento com 120 veículos mostra que o uso começou pela transcrição de entrevistas e pela revisão de texto. A edição final segue com jornalistas.',
      footer: FOOTER,
    },
  },
  {
    id: 'ponto',
    name: 'Ponto principal',
    layout: 'list',
    theme: 'light',
    content: {
      eyebrow: 'Ponto principal',
      title: 'Onde a IA ajuda hoje',
      items: [
        'Transcrever entrevistas em minutos',
        'Sugerir títulos e linhas finas',
        'Checar nomes, datas e números',
        'Adaptar o texto para as redes',
      ],
      footer: FOOTER,
    },
  },
  {
    id: 'citacao',
    name: 'Citação',
    layout: 'quote',
    theme: 'dark',
    content: {
      quote: 'A máquina acelera o rascunho. Quem decide o que é notícia continua sendo a redação.',
      attribution: 'Rafael Dias, editor-chefe do Portal Horizonte',
      footer: FOOTER,
    },
  },
  {
    id: 'conclusao',
    name: 'Conclusão',
    layout: 'closing',
    theme: 'accent',
    content: {
      title: 'A apuração continua humana',
      body: 'Leia a reportagem completa de Marina Lopes no Portal Horizonte.',
      footer: FOOTER,
    },
  },
];

const RATIOS: { value: Ratio; label: string }[] = [
  { value: '4/5', label: '4:5' },
  { value: '1/1', label: '1:1' },
];
const THEMES: { value: SlideTheme; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'accent', label: 'Azul' },
];

/** Prancha: a faixa vira horizontal em coluna estreita (como no produto). */
const NARROW = '(max-width: 760px)';
function useNarrow() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(NARROW);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}

const ORDER: SlideSlot[] = ['title', 'body', 'quote', 'items', 'eyebrow', 'attribution', 'footer'];
/** O aviso da faixa nomeia o primeiro lugar que transborda. */
const firstOver = (over?: SlideOverflow) => (over ? ORDER.find((slot) => over[slot]) : undefined);

/** Estado do carrossel com as ações da faixa: escolher, reordenar, duplicar, excluir, adicionar. */
function useCarousel(initial: Slide[] = SLIDES) {
  const [slides, setSlides] = useState(initial);
  const [selected, setSelected] = useState<string | null>(initial[0]?.id ?? null);
  const [overflow, setOverflow] = useState<Record<string, SlideOverflow>>({});
  const [seq, setSeq] = useState(1);

  const report = (id: string) => (slot: SlideSlot, over: boolean) =>
    setOverflow((all) =>
      Boolean(all[id]?.[slot]) === over ? all : { ...all, [id]: { ...all[id], [slot]: over } },
    );

  const items = (ratio: Ratio): SlideStripItem[] =>
    slides.map((slide, index) => {
      const slot = firstOver(overflow[slide.id]);
      return {
        id: slide.id,
        label: slide.name,
        state: slot ? 'warning' : 'ok',
        issue: slot ? slideOverflowMessage(slide.layout, slot) : undefined,
        thumb: (
          <SlideCanvas
            mode="thumb"
            layout={slide.layout}
            theme={slide.theme}
            content={slide.content}
            ratio={ratio}
            brand={brand}
            page={{ current: index + 1, total: slides.length }}
            onOverflow={report(slide.id)}
          />
        ),
      };
    });

  return {
    slides,
    selected,
    setSelected,
    overflow,
    report,
    items,
    current: slides.find((slide) => slide.id === selected) ?? slides[0],
    update: (id: string, patch: Partial<Slide>) =>
      setSlides((list) => list.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide))),
    reorder: (from: number, to: number) =>
      setSlides((list) => {
        const next = [...list];
        const [moved] = next.splice(from, 1);
        if (moved) next.splice(to, 0, moved);
        return next;
      }),
    duplicate: (id: string) => {
      setSeq((n) => n + 1);
      setSlides((list) => {
        const index = list.findIndex((slide) => slide.id === id);
        const source = list[index];
        if (!source) return list;
        const copy = { ...source, id: `${id}-copia-${seq}`, name: `${source.name} (cópia)` };
        return [...list.slice(0, index + 1), copy, ...list.slice(index + 1)];
      });
    },
    remove: (id: string) => setSlides((list) => list.filter((slide) => slide.id !== id)),
    add: () => {
      const id = `novo-${seq}`;
      setSeq((n) => n + 1);
      setSlides((list) => [
        ...list,
        {
          id,
          name: 'Novo slide',
          layout: 'text',
          theme: 'light',
          content: { title: '', body: '', footer: FOOTER },
        },
      ]);
      setSelected(id);
    },
  };
}

/** Campos do slide escolhido: um por lugar do layout; o transbordo aparece como aviso âmbar. */
function SlotFields({
  slide,
  over,
  focus,
  onChange,
}: {
  slide: Slide;
  over?: SlideOverflow;
  focus: SlideSlot | null;
  onChange: (content: SlideContent) => void;
}) {
  return (
    <div className={x.fields}>
      {slideSlots(slide.layout).map((slot) => {
        const notice = over?.[slot] ? slideOverflowMessage(slide.layout, slot) : undefined;
        const long = slot === 'body' || slot === 'quote' || slot === 'items';
        const value =
          slot === 'items' ? (slide.content.items ?? []).join('\n') : (slide.content[slot] ?? '');
        const set = (text: string) =>
          onChange({
            ...slide.content,
            [slot]: slot === 'items' ? text.split('\n') : text,
          });
        return (
          <Field
            key={slot}
            label={SLIDE_SLOT_LABELS[slot]}
            notice={notice}
            hint={slot === 'items' ? 'Um item por linha' : undefined}
            className={focus === slot ? x.fieldActive : undefined}
          >
            {({ id, describedBy }) =>
              long ? (
                <Textarea
                  id={id}
                  aria-describedby={describedBy}
                  value={value}
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  onChange={(event) => set(event.target.value)}
                />
              ) : (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  value={value}
                  onChange={(event) => set(event.target.value)}
                />
              )
            }
          </Field>
        );
      })}
    </div>
  );
}

/* ——————————————————————————— Faixa de slides ——————————————————————————— */

function Studio() {
  const narrow = useNarrow();
  const carousel = useCarousel();
  const [ratio, setRatio] = useState<Ratio>('4/5');
  const [slot, setSlot] = useState<SlideSlot | null>('title');
  const { current, slides } = carousel;
  const index = slides.findIndex((slide) => slide.id === current?.id);
  return (
    <div className={x.studio}>
      <div className={x.studioStrip}>
        <SlideStrip
          label="Slides do carrossel"
          items={carousel.items(ratio)}
          value={carousel.selected}
          onChange={(id) => {
            carousel.setSelected(id);
            setSlot(null);
          }}
          onReorder={carousel.reorder}
          onDuplicate={carousel.duplicate}
          onRemove={carousel.remove}
          onAdd={carousel.add}
          maxItems={10}
          ratio={ratio}
          orientation={narrow ? 'horizontal' : 'vertical'}
        />
      </div>
      <div className={x.studioStage}>
        <div className={x.stageBar}>
          <Segmented
            label="Proporção"
            size="sm"
            options={RATIOS}
            value={ratio}
            onChange={setRatio}
          />
        </div>
        {current && (
          <div className={x.stageSlide}>
            {/* Teto de altura do próprio quadro: 4:5 fica em 440 de largura, 1:1 em 550. */}
            <SlideCanvas
              key={current.id}
              mode="edit"
              layout={current.layout}
              theme={current.theme}
              content={current.content}
              ratio={ratio}
              maxHeight={550}
              brand={brand}
              page={{ current: index + 1, total: slides.length }}
              selectedSlot={slot}
              onSlotSelect={setSlot}
              onOverflow={carousel.report(current.id)}
            />
          </div>
        )}
      </div>
      {current && (
        <div className={x.studioFields}>
          <Segmented
            label="Tema do slide"
            size="sm"
            full
            options={THEMES}
            value={current.theme}
            onChange={(theme) => carousel.update(current.id, { theme })}
          />
          <SlotFields
            slide={current}
            over={carousel.overflow[current.id]}
            focus={slot}
            onChange={(content) => carousel.update(current.id, { content })}
          />
        </div>
      )}
    </div>
  );
}

const STATE_ITEMS: {
  label: string;
  item: Omit<SlideStripItem, 'id' | 'label'>;
  selected?: boolean;
}[] = [
  { label: 'Repouso', item: {} },
  { label: 'Hover', item: { force: 'hover' } },
  { label: 'Pressionado', item: { force: 'active' } },
  { label: 'Foco', item: { force: 'focus' } },
  { label: 'Selecionado', item: {}, selected: true },
  { label: 'Aviso', item: { state: 'warning', issue: 'Título excede 2 linhas' } },
  { label: 'Erro', item: { state: 'error', issue: 'Falha ao gerar' } },
  { label: 'Com apoio', item: { meta: '42 palavras' } },
];

function thumbOf(slide: Slide, ratio: Ratio = '4/5') {
  return (
    <SlideCanvas
      mode="thumb"
      layout={slide.layout}
      theme={slide.theme}
      content={slide.content}
      ratio={ratio}
      brand={brand}
    />
  );
}

function FaixaSlidesPage() {
  const narrow = useNarrow();
  const horizontal = useCarousel();
  const [h11, setH11] = useState<string | null>('ponto');
  const phone = useCarousel();
  const phoneSlide = phone.current;
  const phoneIndex = phone.slides.findIndex((slide) => slide.id === phoneSlide?.id);
  const capa = SLIDES[0] as Slide;
  return (
    <Shots>
      <Shot title="Estúdio do carrossel" tone="white" align="stretch" pad="none">
        <Studio />
      </Shot>

      <Shot title="Horizontal" tone="white" align="stretch">
        <div className={x.stack}>
          <SlideStrip
            label="Slides em 4:5"
            items={horizontal.items('4/5')}
            value={horizontal.selected}
            onChange={horizontal.setSelected}
            onReorder={horizontal.reorder}
            onDuplicate={horizontal.duplicate}
            onRemove={horizontal.remove}
            onAdd={horizontal.add}
            orientation="horizontal"
          />
          <SlideStrip
            label="Slides em 1:1"
            items={SLIDES.map((slide) => ({
              id: slide.id,
              label: slide.name,
              thumb: thumbOf(slide, '1/1'),
            }))}
            value={h11}
            onChange={setH11}
            ratio="1/1"
            orientation="horizontal"
          />
        </div>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch">
        <States min={narrow ? 200 : 260}>
          {STATE_ITEMS.map(({ label, item, selected }) => (
            <State key={label} label={label}>
              <SlideStrip
                label={label}
                items={[{ id: label, label: capa.name, thumb: thumbOf(capa), ...item }]}
                value={selected ? label : null}
                onChange={() => {}}
                onDuplicate={() => {}}
              />
            </State>
          ))}
          <State label="Aviso na horizontal (dica)">
            <SlideStrip
              label="Aviso na horizontal"
              items={[
                {
                  id: 'capa',
                  label: capa.name,
                  thumb: thumbOf(capa),
                  state: 'warning',
                  issue: 'Título excede 2 linhas',
                  force: 'tip',
                },
              ]}
              value={null}
              onChange={() => {}}
              orientation="horizontal"
            />
          </State>
          <State label="Indisponível">
            <SlideStrip
              label="Indisponível"
              items={[{ id: 'capa', label: capa.name, thumb: thumbOf(capa) }]}
              value="capa"
              onChange={() => {}}
              onDuplicate={() => {}}
              disabled
            />
          </State>
          <State label="Carregando">
            <SlideStrip
              label="Carregando"
              items={[]}
              value={null}
              onChange={() => {}}
              loading
              loadingCount={2}
            />
          </State>
          <State label="Vazio">
            <SlideStrip
              label="Vazio"
              items={[]}
              value={null}
              onChange={() => {}}
              onAdd={() => {}}
            />
          </State>
          <State label="No limite">
            <SlideStrip
              label="No limite"
              items={[{ id: 'capa', label: capa.name, thumb: thumbOf(capa) }]}
              value="capa"
              onChange={() => {}}
              onAdd={() => {}}
              maxItems={1}
            />
          </State>
        </States>
      </Shot>

      <Shot title="Celular" align="center">
        <Phone label="Celular, 390">
          <div className={x.phoneBody}>
            <SlideStrip
              label="Slides do carrossel"
              items={phone.items('4/5')}
              value={phone.selected}
              onChange={phone.setSelected}
              onReorder={phone.reorder}
              onDuplicate={phone.duplicate}
              onRemove={phone.remove}
              onAdd={phone.add}
              orientation="horizontal"
            />
            {phoneSlide && (
              <SlideCanvas
                key={phoneSlide.id}
                layout={phoneSlide.layout}
                theme={phoneSlide.theme}
                content={phoneSlide.content}
                brand={brand}
                page={{ current: phoneIndex + 1, total: phone.slides.length }}
                onOverflow={phone.report(phoneSlide.id)}
              />
            )}
          </div>
        </Phone>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Slide ——————————————————————————— */

const LONG: SlideContent = {
  eyebrow: 'Contexto',
  title: 'Seis em cada dez redações brasileiras já testam inteligência artificial no dia a dia',
  body: 'Levantamento com 120 veículos mostra que o uso começou pela transcrição de entrevistas e pela revisão de texto. Depois vieram sugestões de título, checagem de nomes e datas e adaptação para redes. A edição final segue com jornalistas, que revisam cada trecho antes da publicação e respondem pelo que vai ao ar.',
  footer: FOOTER,
};
const LONG_LIST: SlideContent = {
  title: 'Onde a IA ajuda hoje',
  items: [
    'Transcrever entrevistas em minutos',
    'Sugerir títulos e linhas finas',
    'Checar nomes, datas e números',
    'Adaptar o texto para as redes',
    'Resumir documentos longos',
    'Traduzir fontes estrangeiras',
  ],
  footer: FOOTER,
};

function SlidePage() {
  const [ratio, setRatio] = useState<Ratio>('4/5');
  const [slot, setSlot] = useState<SlideSlot | null>('body');
  const contexto = SLIDES[1] as Slide;
  return (
    <Shots>
      <Shot
        title="Sequência"
        tone="white"
        align="stretch"
        aside={
          <Segmented
            label="Proporção"
            size="sm"
            options={RATIOS}
            value={ratio}
            onChange={setRatio}
          />
        }
      >
        <div className={x.sequence}>
          {SLIDES.map((slide, index) => (
            <SlideCanvas
              key={slide.id}
              layout={slide.layout}
              theme={slide.theme}
              content={slide.content}
              ratio={ratio}
              brand={brand}
              page={{ current: index + 1, total: SLIDES.length }}
            />
          ))}
        </div>
      </Shot>

      <Shot title="Transbordo" tone="white" align="stretch">
        <States min={220}>
          <State label="Edição">
            <SlideCanvas
              mode="edit"
              layout="text"
              content={LONG}
              brand={brand}
              selectedSlot={slot}
              onSlotSelect={setSlot}
            />
          </State>
          <State label="Leitura">
            <SlideCanvas layout="text" content={LONG} brand={brand} />
          </State>
          <State label="Lista em 1:1">
            <SlideCanvas mode="edit" layout="list" content={LONG_LIST} ratio="1/1" brand={brand} />
          </State>
        </States>
      </Shot>

      <Shot title="Temas" tone="white" align="stretch">
        <States min={200}>
          {THEMES.map((theme) => (
            <State key={theme.value} label={theme.label}>
              <SlideCanvas
                layout="cover"
                theme={theme.value}
                content={(SLIDES[0] as Slide).content}
                brand={brand}
              />
            </State>
          ))}
        </States>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch">
        <States min={200}>
          <State label="Repouso">
            <SlideCanvas
              mode="edit"
              layout={contexto.layout}
              content={{ ...contexto.content, title: 'Seis em cada dez redações já testam IA' }}
            />
          </State>
          <State label="Hover">
            <SlideCanvas
              mode="edit"
              layout={contexto.layout}
              content={{ ...contexto.content, title: 'Seis em cada dez redações já testam IA' }}
              slotForce={{ slot: 'title', state: 'hover' }}
            />
          </State>
          <State label="Selecionado">
            <SlideCanvas
              mode="edit"
              layout={contexto.layout}
              content={{ ...contexto.content, title: 'Seis em cada dez redações já testam IA' }}
              selectedSlot="title"
            />
          </State>
          <State label="Foco">
            <SlideCanvas
              mode="edit"
              layout={contexto.layout}
              content={{ ...contexto.content, title: 'Seis em cada dez redações já testam IA' }}
              slotForce={{ slot: 'body', state: 'focus' }}
            />
          </State>
          <State label="Vazio">
            <SlideCanvas mode="edit" layout="text" content={{ footer: FOOTER }} />
          </State>
          <State label="Carregando">
            <SlideCanvas layout="cover" content={{}} state="loading" />
          </State>
          <State label="Erro">
            <SlideCanvas layout="cover" content={{}} state="error" onRetry={() => {}} />
          </State>
          <State label="Azul selecionado">
            <SlideCanvas
              mode="edit"
              layout="closing"
              theme="accent"
              content={(SLIDES[4] as Slide).content}
              selectedSlot="title"
            />
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

export const specimens: Record<string, ComponentType> = {
  'faixa-slides': FaixaSlidesPage,
  slide: SlidePage,
};
