'use client';
import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  Copy,
  Layers2,
  Menu,
  Search,
  type LucideIcon,
  Type,
  MousePointer2,
  TextCursorInput,
  Navigation,
  PanelLeft,
  Table2,
  ChartNoAxesCombined,
  Bell,
  PanelsTopLeft,
  Image,
  Workflow,
  LayoutTemplate,
} from 'lucide-react';
import {
  Button,
  IconButton,
  Input,
  Tabs,
  ToastViewport,
  useToast,
  Dialog,
  Status,
  Textarea,
} from '../../components/ds-v2';
import { inventory, normalizeSearch } from '../inventory';
import {
  catalogItems,
  aliases,
  itemKind,
  familyGuides,
  specificGuides,
  publicComponents,
  snippets,
  type CatalogItem,
} from './registry';
import { Usage } from './base-examples';
import { FieldSpecimen } from './field-specimens';
import { ChartSpecimen } from './chart-specimens';
import { DataSpecimen } from './data-specimens';
import { FeedbackSpecimen, LayerSpecimen, MediaSpecimen } from './surface-specimens';
import {
  FoundationSpecimen,
  ActionSpecimen,
  NavigationSpecimen,
  StructureSpecimen,
} from './system-specimens';
import { ProductSpecimen, TemplateSpecimen } from './product-specimens';
import c from './catalog.module.css';
import s from './specimen.module.css';
import w from './workbench.module.css';
const icons: Record<string, LucideIcon> = {
  fundamentos: Type,
  acoes: MousePointer2,
  formularios: TextCursorInput,
  navegacao: Navigation,
  estrutura: PanelLeft,
  dados: Table2,
  graficos: ChartNoAxesCombined,
  feedback: Bell,
  camadas: PanelsTopLeft,
  midia: Image,
  padroes: Workflow,
  templates: LayoutTemplate,
};
function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}
function snapshot() {
  const raw = window.location.hash.slice(1);
  const id = aliases[raw] ?? raw;
  return catalogItems.some((item) => item.id === id) ||
    ['visao-geral', 'inventario', 'uso'].includes(id)
    ? id
    : 'visao-geral';
}
const reviewKey = 'mediaon-dsv2-item-reviews';
type Review = { reviewed: boolean; note: string };
function readReviews(): Record<string, Review> {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(reviewKey) ?? '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    return Object.fromEntries(
      Object.entries(saved).filter(
        ([id, value]) =>
          catalogItems.some((item) => item.id === id) &&
          value &&
          typeof value === 'object' &&
          typeof value.reviewed === 'boolean' &&
          typeof value.note === 'string',
      ),
    );
  } catch {
    return {};
  }
}

export function CatalogSpecimen({
  item,
  notify,
}: {
  item: CatalogItem;
  notify: ReturnType<typeof useToast>['notify'];
}) {
  switch (item.groupId) {
    case 'fundamentos':
      return <FoundationSpecimen id={item.id} />;
    case 'acoes':
      return <ActionSpecimen id={item.id} notify={notify} />;
    case 'formularios':
      return <FieldSpecimen id={item.id} notify={notify} />;
    case 'navegacao':
      return <NavigationSpecimen id={item.id} notify={notify} />;
    case 'estrutura':
      return <StructureSpecimen id={item.id} notify={notify} />;
    case 'dados':
      return <DataSpecimen id={item.id} notify={notify} />;
    case 'graficos':
      return <ChartSpecimen id={item.id} />;
    case 'feedback':
      return <FeedbackSpecimen id={item.id} notify={notify} />;
    case 'camadas':
      return <LayerSpecimen id={item.id} notify={notify} />;
    case 'midia':
      return <MediaSpecimen id={item.id} />;
    case 'padroes':
      return <ProductSpecimen id={item.id} notify={notify} />;
    case 'templates':
      return <TemplateSpecimen id={item.id} notify={notify} />;
    default:
      throw new Error(`Família sem exemplo: ${item.groupId}`);
  }
}
function Sidebar({
  active,
  query,
  setQuery,
  onNavigate,
  reviewed,
}: {
  active: string;
  query: string;
  setQuery: (value: string) => void;
  onNavigate: () => void;
  reviewed: Record<string, Review>;
}) {
  const navId = useId();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const normalized = normalizeSearch(query);
  const activeFamily = catalogItems.find((item) => item.id === active)?.groupId;
  const visible = inventory
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        normalizeSearch(`${item.label} ${item.scope} ${item.keywords} ${group.label}`).includes(
          normalized,
        ),
      ),
    }))
    .filter((group) => group.items.length);
  return (
    <>
      <a className={c.brand} href="#visao-geral" onClick={onNavigate}>
        <span>
          <Layers2 size={23} />
        </span>
        <div>
          <strong>MediaOn</strong>
          <small>Design System V2</small>
        </div>
      </a>
      <div className={c.navSearch}>
        <Input
          aria-label="Buscar componentes"
          placeholder="Buscar nos 126 itens…"
          icon={<Search size={14} />}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <nav aria-label="Biblioteca de componentes" className={w.libraryNav}>
        {!query && (
          <div className={w.startLinks}>
            {[
              ['visao-geral', 'Visão geral'],
              ['inventario', 'Inventário completo'],
              ['uso', 'Como usar'],
            ].map(([id, label]) => (
              <a
                href={`#${id}`}
                key={id}
                onClick={onNavigate}
                aria-current={active === id ? 'page' : undefined}
              >
                {label}
                {id === 'inventario' && <small>126</small>}
              </a>
            ))}
          </div>
        )}
        <div className={w.navLabel}>
          {query
            ? `${visible.reduce((sum, group) => sum + group.items.length, 0)} ${visible.reduce((sum, group) => sum + group.items.length, 0) === 1 ? 'resultado' : 'resultados'}`
            : 'Biblioteca'}
        </div>
        {visible.map((group) => {
          const Icon = icons[group.id]!;
          const isExpanded = !!query || (expanded[group.id] ?? activeFamily === group.id);
          return (
            <div className={w.family} key={group.id}>
              <button
                type="button"
                className={w.familyToggle}
                aria-expanded={isExpanded}
                aria-controls={`${navId}-${group.id}`}
                onClick={() =>
                  setExpanded((previous) => ({ ...previous, [group.id]: !isExpanded }))
                }
              >
                <Icon size={16} />
                <span>{group.label}</span>
                <small>{group.items.length}</small>
                <ChevronDown
                  size={12}
                  style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                />
              </button>
              <div id={`${navId}-${group.id}`} hidden={!isExpanded}>
                {group.items.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    aria-current={active === item.id ? 'page' : undefined}
                    onClick={onNavigate}
                  >
                    <span>{item.label}</span>
                    {reviewed[item.id]?.reviewed && <Check size={12} aria-label="Revisado" />}
                  </a>
                ))}
              </div>
            </div>
          );
        })}
        {!visible.length && <p className={c.noResults}>Nenhum componente encontrado.</p>}
      </nav>
      <a href="/dashboardv2" className={c.back}>
        <ArrowLeft size={15} />
        Ver Dashboard V2
      </a>
    </>
  );
}
export function DesignSystemCatalog() {
  const active = useSyncExternalStore(subscribe, snapshot, () => 'visao-geral');
  const [query, setQuery] = useState('');
  const [mobile, setMobile] = useState(false);
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const { toast, notify, dismiss } = useToast({ fallbackFocusId: 'ds-content' });
  useEffect(() => setReviews(readReviews()), []);
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [active]);
  const item = catalogItems.find((entry) => entry.id === active);
  const title =
    item?.label ??
    {
      'visao-geral': 'Biblioteca do produto',
      inventario: 'Inventário completo',
      uso: 'Como usar a biblioteca',
    }[active];
  const description =
    item?.scope ??
    (active === 'visao-geral'
      ? 'Fundamentos, componentes e fluxos do MediaOn na base visual aprovada.'
      : active === 'inventario'
        ? '126 referências organizadas em 12 famílias. Cada item tem um exemplo para revisar.'
        : 'Tokens e componentes compartilhados com o Dashboard V2.');
  function saveReview(id: string, value: Review) {
    const next = { ...reviews, [id]: value };
    setReviews(next);
    try {
      localStorage.setItem(reviewKey, JSON.stringify(next));
    } catch {
      notify({
        variant: 'warning',
        message: 'Revisão mantida nesta sessão. O navegador não permitiu salvá-la.',
      });
    }
  }
  const sidebar = (
    <Sidebar
      active={active}
      query={query}
      setQuery={setQuery}
      onNavigate={() => setMobile(false)}
      reviewed={reviews}
    />
  );
  return (
    <div className={`${c.catalog} ${w.catalog}`}>
      <a
        href="#ds-content"
        className={c.skip}
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('ds-content')?.focus();
        }}
      >
        Pular para o conteúdo
      </a>
      <aside className={`${c.sidebar} ${w.desktopSidebar}`}>{sidebar}</aside>
      <main className={c.main}>
        <header className={c.topbar}>
          <div className={w.crumb}>
            <IconButton
              label="Abrir biblioteca"
              icon={Menu}
              className={w.mobileTrigger}
              variant="ghost"
              onClick={() => setMobile(true)}
            />
            <span>
              Design System <span>/</span> <strong>{item?.groupLabel ?? 'V2'}</strong>
            </span>
          </div>
          <a href="/dashboardv2" className={w.appLink}>
            Aplicação de referência <ArrowRight size={13} />
          </a>
        </header>
        <div className={`${c.pageHeading} ${w.heading}`}>
          <div>
            <div className={w.eyebrow}>
              {item ? `${itemKind(item)} · ${item.groupLabel}` : 'MediaOn / Biblioteca visual'}
            </div>
            <h1 id="ds-content" tabIndex={-1}>
              {title}
            </h1>
            {!item && <p>{description}</p>}
          </div>
          {item && (
            <div className={s.row}>
              <IconButton
                icon={Copy}
                label="Copiar link deste item"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}/design-system-v2#${item.id}`,
                    );
                    notify('Link do item copiado.');
                  } catch {
                    notify({
                      variant: 'info',
                      message: `Link do item: /design-system-v2#${item.id}`,
                    });
                  }
                }}
              />
              <Button
                icon={reviews[item.id]?.reviewed ? CheckCheck : Check}
                onClick={() =>
                  saveReview(item.id, {
                    note: reviews[item.id]?.note ?? '',
                    reviewed: !reviews[item.id]?.reviewed,
                  })
                }
              >
                {reviews[item.id]?.reviewed ? 'Revisado por você' : 'Marcar revisado'}
              </Button>
            </div>
          )}
        </div>
        <div className={`${c.content} ${w.content}`} key={active}>
          {active === 'visao-geral' && <Overview reviews={reviews} />}{' '}
          {active === 'inventario' && <InventoryIndex reviews={reviews} />}{' '}
          {active === 'uso' && <Usage notify={notify} />}{' '}
          {item && (
            <ItemPage
              item={item}
              notify={notify}
              review={reviews[item.id]}
              onSaveReview={(value) => saveReview(item.id, value)}
            />
          )}
        </div>
      </main>
      <Dialog kind="drawer" open={mobile} onClose={() => setMobile(false)} title="Biblioteca V2">
        <div className={w.mobileNav}>{sidebar}</div>
      </Dialog>
      <ToastViewport toast={toast} dismiss={dismiss} />
    </div>
  );
}
function Overview({ reviews }: { reviews: Record<string, Review> }) {
  const count = Object.values(reviews).filter((review) => review.reviewed).length;
  return (
    <>
      <div className={w.overview}>
        <div>
          <span className={w.eyebrow}>A base aprovada, em detalhe</span>
          <h2>Do controle à tela completa.</h2>
          <p>
            Explore os estados de cada componente e as composições que dão forma às campanhas, ao
            inventário e aos fluxos comerciais.
          </p>
          <div className={w.overviewLinks}>
            <a href="#inventario">
              Explorar o inventário <ArrowRight size={14} />
            </a>
            <a href="#template-dashboard">
              Ver templates <LayoutTemplate size={14} />
            </a>
          </div>
        </div>
        <div className={w.overviewStats}>
          <div>
            <strong>126</strong>
            <span>referências</span>
          </div>
          <div>
            <strong>12</strong>
            <span>famílias</span>
          </div>
          <div>
            <strong>{count}</strong>
            <span>revisadas por você</span>
          </div>
        </div>
      </div>
      <section className={w.featured}>
        <div className={w.referenceLinks}>
          <span>Refinados a partir das suas referências</span>
          <div>
            <a href="#calendario">Agenda</a>
            <a href="#template-configuracoes">Configurações</a>
            <a href="#drawer">Detalhes e histórico</a>
            <a href="#planos">Planos</a>
            <a href="#alerta">Avisos</a>
            <a href="#kanban">Kanban</a>
            <a href="#upload">Upload</a>
            <a href="#avatar">Avatares</a>
            <a href="#wizard">Cadastro em etapas</a>
            <a href="#modal">Escolhas visuais</a>
            <a href="#membros">Membros</a>
            <a href="#template-dashboard">Checklist</a>
          </div>
        </div>
        <div className={w.sectionHeading}>
          <div>
            <h2>Comece pelas partes que mais aparecem</h2>
            <p>Exemplos com conteúdo, variantes e comportamento.</p>
          </div>
          <a href="#campo">
            Revisar campos <ArrowRight size={13} />
          </a>
        </div>
        <div className={w.featuredGrid}>
          <a href="#campo" className={w.featureCard}>
            <div className={w.fieldMini}>
              <span>Nome da campanha</span>
              <div>
                Lançamento primavera<span>|</span>
              </div>
              <small>Use um nome fácil de encontrar.</small>
            </div>
            <div>
              <strong>Campos e formulários</strong>
              <span>Rótulos, estados, validação e seleção</span>
            </div>
            <ArrowRight size={16} />
          </a>
          <a href="#data-table" className={w.featureCard}>
            <div className={w.tableMini}>
              <div>
                <span>Campanha</span>
                <span>Status</span>
              </div>
              <div>
                <strong>Lançamento primavera</strong>
                <i>Em veiculação</i>
              </div>
              <div>
                <strong>Novos caminhos</strong>
                <i>Rascunho</i>
              </div>
            </div>
            <div>
              <strong>Tabelas e operação</strong>
              <span>Conteúdo, filtros, seleção e ações</span>
            </div>
            <ArrowRight size={16} />
          </a>
          <a href="#wizard" className={w.featureCard}>
            <div className={w.stepsMini}>
              <span>1</span>
              <i />
              <span>2</span>
              <i />
              <span>3</span>
              <p>Informações → Mídias → Revisão</p>
            </div>
            <div>
              <strong>Padrões do MediaOn</strong>
              <span>Fluxos comerciais com contexto real</span>
            </div>
            <ArrowRight size={16} />
          </a>
        </div>
      </section>
      <div className={w.sectionHeading}>
        <div>
          <h2>Todas as famílias</h2>
          <p>Da fundação visual às composições de página.</p>
        </div>
        <span className={w.small}>126 itens com exemplos</span>
      </div>
      <div className={w.familyIndex}>
        {inventory.map((group) => {
          const Icon = icons[group.id]!;
          return (
            <a key={group.id} href={`#${group.items[0]?.id}`}>
              <Icon size={19} />
              <div>
                <strong>{group.label}</strong>
                <span>
                  {group.items
                    .slice(0, 3)
                    .map((item) => item.label)
                    .join(' · ')}
                </span>
              </div>
              <small>{group.items.length}</small>
              <ArrowRight size={14} />
            </a>
          );
        })}
      </div>
      <div className={w.revisionNote}>
        <InfoMark />
        <div>
          <strong>Uma biblioteca para revisar por partes.</strong>
          <p>
            Cada referência tem link próprio e espaço para suas notas. “Revisado” é uma marcação
            sua, salva neste navegador. A cobertura visual não significa que todas as composições já
            são componentes publicados.
          </p>
        </div>
      </div>
    </>
  );
}
function InfoMark() {
  return <Layers2 size={18} />;
}
function InventoryIndex({ reviews }: { reviews: Record<string, Review> }) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('Todos');
  const filtered = catalogItems.filter(
    (item) =>
      normalizeSearch(`${item.label} ${item.scope} ${item.groupLabel}`).includes(
        normalizeSearch(query),
      ) &&
      (kind === 'Todos' ||
        (kind === 'Pendentes de revisão' && !reviews[item.id]?.reviewed) ||
        (kind === 'Revisados' && reviews[item.id]?.reviewed)),
  );
  return (
    <>
      <div className={w.indexToolbar}>
        <Input
          aria-label="Filtrar inventário"
          icon={<Search size={14} />}
          placeholder="Buscar no inventário completo…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Tabs
          values={['Todos', 'Pendentes de revisão', 'Revisados'].map((label) => ({
            id: label,
            label,
          }))}
          active={kind}
          onChange={setKind}
        />
        <span className={w.small}>{filtered.length} itens</span>
      </div>
      {inventory.map((group) => {
        const items = filtered.filter((item) => item.groupId === group.id);
        if (!items.length) return null;
        const Icon = icons[group.id]!;
        return (
          <section className={w.indexGroup} key={group.id}>
            <header>
              <Icon size={18} />
              <h2>{group.label}</h2>
              <span>{items.length}</span>
            </header>
            {items.map((item) => (
              <a href={`#${item.id}`} key={item.id}>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.scope}</p>
                </div>
                <span>{reviews[item.id]?.reviewed ? <Check size={15} /> : itemKind(item)}</span>
                <ArrowRight size={14} />
              </a>
            ))}
          </section>
        );
      })}
      {!filtered.length && (
        <div className={s.empty}>
          <h3>Nenhum item neste recorte</h3>
          <Button
            onClick={() => {
              setQuery('');
              setKind('Todos');
            }}
          >
            Ver inventário completo
          </Button>
        </div>
      )}
    </>
  );
}
function ItemPage({
  item,
  notify,
  review,
  onSaveReview,
}: {
  item: CatalogItem;
  notify: ReturnType<typeof useToast>['notify'];
  review?: Review;
  onSaveReview: (value: Review) => void;
}) {
  const [tab, setTab] = useState('preview');
  const [note, setNote] = useState(review?.note ?? '');
  useEffect(() => setNote(review?.note ?? ''), [review?.note]);
  const guide = familyGuides[item.groupId]!;
  const index = catalogItems.findIndex((entry) => entry.id === item.id);
  const siblings = inventory.find((group) => group.id === item.groupId)!.items;
  return (
    <>
      <div className={w.itemToolbar}>
        <Tabs
          label="Documentação do item"
          values={[
            { id: 'preview', label: 'Exemplo', panelId: 'specimen-preview' },
            { id: 'guidelines', label: 'Uso e estados', panelId: 'specimen-guidelines' },
            { id: 'review', label: 'Minha revisão', panelId: 'specimen-review' },
          ]}
          active={tab}
          onChange={setTab}
        />
        <span className={w.small}>
          {siblings.findIndex((entry) => entry.id === item.id) + 1} de {siblings.length} nesta
          família
        </span>
      </div>
      <div hidden={tab !== 'preview'} id="specimen-preview" role="tabpanel" aria-label="Exemplo">
        <CatalogSpecimen item={item} notify={notify} />
        <div className={w.exampleContext}>
          <span>
            {publicComponents[item.id] ? 'Fonte compartilhada' : 'Composição de referência'}
          </span>
          <p>{specificGuides[item.id] ?? guide.usage}</p>
          {publicComponents[item.id] && <code>{publicComponents[item.id]}</code>}
        </div>
      </div>
      <div
        hidden={tab !== 'guidelines'}
        id="specimen-guidelines"
        role="tabpanel"
        aria-label="Uso e estados"
      >
        <div className={w.guidelines}>
          <Guide title="Quando e como usar">
            {specificGuides[item.id] ?? item.scope} {guide.usage}
          </Guide>
          <Guide title="Estados para conferir">{guide.states}</Guide>
          <Guide title="Teclado e acessibilidade">{guide.keyboard}</Guide>
          <Guide title="Evitar">{guide.avoid}</Guide>
        </div>
        {publicComponents[item.id] && (
          <div className={s.stack}>
            <h3>Implementação compartilhada</h3>
            <code className={s.code}>
              import {'{ '}
              {publicComponents[item.id]}
              {' }'} from &apos;@/components/ds-v2&apos;;
              {snippets[item.id] ? `\n\n${snippets[item.id]}` : ''}
            </code>
            <p className={s.muted}>
              O componente é reutilizável. Dados, ordenação, regras comerciais e persistência
              pertencem à tela que o utiliza.
            </p>
          </div>
        )}
        {!publicComponents[item.id] && (
          <div className={w.revisionNote}>
            <Layers2 size={18} />
            <div>
              <strong>{itemKind(item)} para avaliação</strong>
              <p>
                O exemplo usa controles V2 e estado local. Esta referência ainda não é uma API
                pública isolada da biblioteca.
              </p>
            </div>
          </div>
        )}
      </div>
      <div
        hidden={tab !== 'review'}
        id="specimen-review"
        role="tabpanel"
        aria-label="Minha revisão"
      >
        <div className={s.form} style={{ marginLeft: 0, maxWidth: 640 }}>
          <h3>Notas sobre {item.label.toLowerCase()}</h3>
          <label htmlFor="review-note">O que você quer ajustar neste item?</label>
          <Textarea
            id="review-note"
            maxLength={2000}
            rows={5}
            placeholder="Ex.: reduzir o espaçamento, testar outro estado, rever o rótulo…"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className={s.row}>
            <Button
              variant="primary"
              onClick={() => {
                onSaveReview({ reviewed: review?.reviewed ?? false, note });
                notify('Nota salva neste navegador.');
              }}
            >
              Salvar nota
            </Button>
            <span className={s.muted}>Não é enviada para outras pessoas.</span>
          </div>
          {review?.reviewed && <Status value="Revisado por você" tone="green" />}
        </div>
      </div>
      <footer className={w.pagination}>
        {index > 0 ? (
          <a href={`#${catalogItems[index - 1]?.id}`}>
            <ArrowLeft size={15} />
            <div>
              <small>Anterior</small>
              <strong>{catalogItems[index - 1]?.label}</strong>
            </div>
          </a>
        ) : (
          <span />
        )}
        {index < catalogItems.length - 1 && (
          <a href={`#${catalogItems[index + 1]?.id}`}>
            <div>
              <small>Próximo</small>
              <strong>{catalogItems[index + 1]?.label}</strong>
            </div>
            <ArrowRight size={15} />
          </a>
        )}
      </footer>
    </>
  );
}
function Guide({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  );
}
