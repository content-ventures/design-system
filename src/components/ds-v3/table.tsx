'use client';

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Columns3,
  LoaderCircle,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Button } from './button';
import { Tooltip, TruncatedText } from './overlays';
import { Checkbox } from './selection';
import s from './table.module.css';

export type Column<Row> = {
  key: string;
  header: ReactNode;
  render: (row: Row) => ReactNode;
  align?: 'start' | 'center' | 'end';
  width?: number | string;
  sortable?: boolean;
  /** Número: tabular, alinhado à direita, peso 500. */
  numeric?: boolean;
  /** Definição do termo do cabeçalho: sublinhado pontilhado e dica (“Frequência”). */
  hint?: string;
  /** Texto longo numa linha só, com reticências; o `title` mostra o valor inteiro. */
  truncate?: boolean;
  /** Valor inteiro para o `title` da célula truncada (padrão: o texto renderizado). */
  title?: (row: Row) => string | undefined;
  /** O que mostrar quando `render` não devolve nada (ex.: “—”, em `--muted`). */
  fallback?: ReactNode;
  /** Bloco do esqueleto desta coluna enquanto carrega. */
  skeleton?: 'text' | 'lines' | 'short' | 'control' | 'none';
  /** Nome no menu “Colunas” quando o cabeçalho não é texto. */
  name?: string;
  /** Fica fora do menu “Colunas” (não pode ser escondida). */
  pinned?: boolean;
};
export type SortState = { key: string; direction: 'asc' | 'desc' };

const EASE_MOVE = 'cubic-bezier(0.65, 0, 0.35, 1)';
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const toSet = (value?: ReadonlySet<string> | readonly string[]) =>
  value instanceof Set ? (value as ReadonlySet<string>) : new Set<string>(value ?? []);
const isBlank = (node: ReactNode) =>
  node === null || node === undefined || node === false || node === '';
const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof Element &&
  Boolean(
    target.closest(
      'a[href], button, input, select, textarea, label, summary, [role="button"], [role="link"], [role="switch"], [role="checkbox"], [role="radio"], [data-row-interactive]',
    ),
  );

/** Largura dos blocos do esqueleto: varia por linha e coluna, sem aleatoriedade (SSR estável). */
const skeletonWidth = (row: number, col: number) => 42 + ((row * 37 + col * 23) % 34);

/**
 * Tabela de registros. A biblioteca desenha e comunica intenção (ordenar, selecionar, abrir);
 * filtrar e ordenar os dados é responsabilidade de quem consome.
 *
 * - `variant="data"` (padrão): moldura, cabeçalho em faixa `--g-50` arredondada.
 * - `variant="plain"`: sem moldura, cabeçalho em legenda com fio embaixo — tabelas de Analytics
 *   dentro de um painel (a linha em hover sangra 12 px para os lados).
 * - Ordenar reordena as linhas por FLIP (280 ms); `hiddenColumns` recolhe a coluna (180 ms);
 *   `loading` desenha o esqueleto com a geometria real; `error` e `empty` ocupam a largura toda.
 */
export function DataTable<Row>({
  label,
  rows,
  rowKey,
  columns,
  selectable = false,
  selected,
  onSelectedChange,
  sort,
  onSort,
  onRowClick,
  empty,
  density = 'comfortable',
  footer,
  fixed = false,
  variant = 'data',
  totalRow,
  hiddenColumns,
  loading = false,
  loadingRows,
  error,
  banner,
  pending,
  exiting,
  transitionKey,
  rowLabel,
  rowData,
  stack = true,
}: {
  label: string;
  rows: Row[];
  rowKey: (row: Row) => string;
  columns: Column<Row>[];
  selectable?: boolean;
  selected?: ReadonlySet<string>;
  onSelectedChange?: (next: Set<string>) => void;
  sort?: SortState;
  onSort?: (next: SortState) => void;
  onRowClick?: (row: Row) => void;
  empty?: ReactNode;
  density?: 'comfortable' | 'compact';
  footer?: ReactNode;
  /** Larguras fixas (table-layout: fixed): colunas alinham entre tabelas vizinhas. */
  fixed?: boolean;
  variant?: 'data' | 'plain';
  /** Linha de total (peso 500, fio acima), por chave de coluna. A primeira célula vira cabeçalho. */
  totalRow?: Partial<Record<string, ReactNode>>;
  /** Colunas escondidas (chaves). Mudar recolhe ou abre a coluna com animação. */
  hiddenColumns?: ReadonlySet<string> | readonly string[];
  /** Esqueleto com a geometria das colunas no lugar das linhas. */
  loading?: boolean;
  /** Quantas linhas de esqueleto (padrão: as linhas atuais, ou 6). */
  loadingRows?: number;
  /** Falha ao carregar: ocupa o corpo inteiro no lugar das linhas. */
  error?: ReactNode;
  /** Faixa acima das linhas (ex.: `SelectAllBand`). */
  banner?: ReactNode;
  /** Linhas em processamento (ação em lote): esmaecem a 50%. */
  pending?: ReadonlySet<string>;
  /** Linhas saindo (excluídas): recolhem antes de quem consome tirá-las de `rows`. */
  exiting?: ReadonlySet<string>;
  /** Trocar a chave troca o corpo com crossfade (filtros, recortes). */
  transitionKey?: string;
  /** Nome acessível de cada linha (seleção): “Selecionar {nome}”. */
  rowLabel?: (row: Row) => string;
  /** Atributos `data-*` da linha (`{ testid: 'x' }` → `data-testid="x"`): marcação e testes. */
  rowData?: (row: Row) => Record<string, string>;
  /**
   * Até 760 px cada linha vira um cartão: a primeira coluna é o título e as outras viram
   * pares rótulo–valor (contrato §12). Desligue só em tabelas que já cabem no celular.
   */
  stack?: boolean;
}) {
  const keys = rows.map(rowKey);
  const chosen = selected ?? new Set<string>();
  const all = keys.length > 0 && keys.every((key) => chosen.has(key));
  const some = keys.some((key) => chosen.has(key));
  const hidden = toSet(hiddenColumns);
  const hiddenKey = [...hidden].sort().join('|');

  // Colunas que entram ou saem: continuam montadas durante a animação (estado derivado da prop).
  const [prevHidden, setPrevHidden] = useState(hiddenKey);
  const [motion, setMotion] = useState<Record<string, 'in' | 'out'>>({});
  if (prevHidden !== hiddenKey) {
    const before = new Set(prevHidden ? prevHidden.split('|') : []);
    const next: Record<string, 'in' | 'out'> = { ...motion };
    if (!reduced()) {
      hidden.forEach((key) => !before.has(key) && (next[key] = 'out'));
      before.forEach((key) => !hidden.has(key) && (next[key] = 'in'));
    }
    setPrevHidden(hiddenKey);
    setMotion(next);
  }
  const visible = columns.filter(
    (column) => !hidden.has(column.key) || motion[column.key] === 'out',
  );
  const span = visible.length + (selectable ? 1 : 0);
  // Título do cartão no celular: a coluna fixa (`pinned`) — o nome do registro —, senão a primeira
  // com cabeçalho. Coluna de indicador antes do nome (o ponto "no ar") não rouba o título.
  const titleKey = (
    visible.find((column) => column.pinned && column.header !== '') ??
    visible.find((column) => column.header !== '')
  )?.key;

  const tableRef = useRef<HTMLTableElement>(null);
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  // Recolher/abrir coluna: largura e respiro vão a zero (ou voltam), o conteúdo esmaece.
  const motionKey = Object.entries(motion)
    .map(([key, dir]) => `${key}:${dir}`)
    .join('|');
  useLayoutEffect(() => {
    const table = tableRef.current;
    if (!table || !motionKey) return;
    const animations: Animation[] = [];
    Object.entries(motion).forEach(([key, dir]) => {
      const cells = [...table.querySelectorAll<HTMLElement>(`[data-col="${CSS.escape(key)}"]`)];
      const head = cells.find(
        (cell) => cell.tagName === 'TH' && cell.parentElement?.parentElement?.tagName === 'THEAD',
      );
      const width = head?.getBoundingClientRect().width ?? 0;
      const frames = (from: Keyframe, to: Keyframe) => (dir === 'out' ? [from, to] : [to, from]);
      const timing: KeyframeAnimationOptions = {
        duration: 180,
        easing: dir === 'out' ? EASE_IN : EASE_OUT,
        fill: dir === 'out' ? 'forwards' : 'none',
      };
      cells.forEach((cell) => {
        const style = getComputedStyle(cell);
        animations.push(
          cell.animate(
            frames(
              { paddingLeft: style.paddingLeft, paddingRight: style.paddingRight },
              { paddingLeft: '0px', paddingRight: '0px' },
            ),
            timing,
          ),
        );
        const inner = cell.firstElementChild as HTMLElement | null;
        if (inner?.dataset.motion !== undefined) {
          const natural = Math.max(inner.scrollWidth, 1);
          animations.push(
            inner.animate(
              frames({ maxWidth: `${natural}px`, opacity: 1 }, { maxWidth: '0px', opacity: 0 }),
              timing,
            ),
          );
        }
      });
      if (head) {
        animations.push(head.animate(frames({ width: `${width}px` }, { width: '0px' }), timing));
      }
    });
    const timer = window.setTimeout(() => {
      setMotion((current) => {
        const next = { ...current };
        Object.keys(motion).forEach((key) => delete next[key]);
        return next;
      });
    }, 190);
    return () => {
      window.clearTimeout(timer);
      animations.forEach((animation) => animation.cancel());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motionKey]);

  // Ordenar: cada linha desliza da posição antiga para a nova (FLIP, 280 ms, --ease-move).
  const positions = useRef(new Map<string, number>());
  const sortKey = sort ? `${sort.key}:${sort.direction}` : '';
  const lastSort = useRef(sortKey);
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const list = [...body.querySelectorAll<HTMLTableRowElement>(':scope > tr[data-key]')];
    const next = new Map(list.map((tr) => [tr.dataset.key ?? '', tr.offsetTop]));
    if (lastSort.current !== sortKey && !reduced()) {
      list.forEach((tr) => {
        const before = positions.current.get(tr.dataset.key ?? '');
        const after = next.get(tr.dataset.key ?? '');
        if (before === undefined || after === undefined || before === after) return;
        tr.animate([{ transform: `translateY(${before - after}px)` }, { transform: 'none' }], {
          duration: 280,
          easing: EASE_MOVE,
        });
      });
    }
    lastSort.current = sortKey;
    positions.current = next;
  });

  function toggle(key: string) {
    const next = new Set(chosen);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectedChange?.(next);
  }
  const wrap = (key: string, content: ReactNode) =>
    motion[key] ? (
      <div className={s.colMotion} data-motion="">
        {content}
      </div>
    ) : (
      content
    );
  const exitWrap = (isExiting: boolean, content: ReactNode) =>
    isExiting ? (
      <div className={s.rowExit}>
        <div>{content}</div>
      </div>
    ) : (
      content
    );

  const skeletonCount = loadingRows ?? (rows.length || 6);
  const mode = loading ? 'loading' : error ? 'error' : rows.length === 0 ? 'empty' : 'rows';

  return (
    <div className={s.frame} data-variant={variant} data-stack={stack || undefined}>
      <div className={s.scroll}>
        <table
          ref={tableRef}
          className={s.table}
          data-variant={variant}
          data-density={density}
          data-fixed={fixed || undefined}
          aria-busy={loading || undefined}
        >
          <caption className={s.caption}>{label}</caption>
          <thead>
            <tr>
              {selectable && (
                <th className={s.check} scope="col">
                  <Checkbox
                    aria-label={all ? 'Desmarcar todos' : 'Selecionar todos'}
                    checked={all}
                    indeterminate={some && !all}
                    disabled={loading || rows.length === 0}
                    onChange={() => {
                      // Soma (ou tira) só as linhas desta tabela: a seleção feita em outra página
                      // ou em outro grupo continua valendo.
                      const next = new Set(chosen);
                      keys.forEach((key) => (all ? next.delete(key) : next.add(key)));
                      onSelectedChange?.(next);
                    }}
                  />
                </th>
              )}
              {visible.map((column) => {
                const active = sort?.key === column.key;
                const SortIcon: LucideIcon = !active
                  ? ArrowUpDown
                  : sort?.direction === 'asc'
                    ? ArrowUp
                    : ArrowDown;
                const text = column.hint ? (
                  <span className={s.term}>{column.header}</span>
                ) : (
                  column.header
                );
                let content: ReactNode = text;
                if (column.sortable && onSort) {
                  const button = (
                    <button
                      type="button"
                      className={s.sort}
                      data-active={active || undefined}
                      onClick={() =>
                        onSort({
                          key: column.key,
                          direction: active && sort?.direction === 'desc' ? 'asc' : 'desc',
                        })
                      }
                    >
                      {text}
                      <SortIcon aria-hidden="true" />
                    </button>
                  );
                  content = column.hint ? (
                    <Tooltip content={column.hint}>{button}</Tooltip>
                  ) : (
                    button
                  );
                } else if (column.hint) {
                  content = (
                    <Tooltip content={column.hint}>
                      <span className={s.term} tabIndex={0}>
                        {column.header}
                      </span>
                    </Tooltip>
                  );
                }
                return (
                  <th
                    key={column.key}
                    scope="col"
                    data-col={column.key}
                    data-align={column.numeric ? 'end' : column.align}
                    style={column.width ? { width: column.width } : undefined}
                    aria-sort={
                      active ? (sort?.direction === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                  >
                    {wrap(column.key, content)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody
            ref={bodyRef}
            key={`${mode}:${transitionKey ?? ''}`}
            className={s.body}
            data-mode={mode}
          >
            {banner && mode === 'rows' && (
              <tr className={s.bannerRow}>
                <td colSpan={span}>
                  <div className={s.banner}>
                    <div>{banner}</div>
                  </div>
                </td>
              </tr>
            )}
            {mode === 'loading' &&
              Array.from({ length: skeletonCount }, (_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className={s.skeletonRow} aria-hidden="true">
                  {selectable && (
                    <td className={s.check}>
                      <span className={s.skel} data-kind="control" />
                    </td>
                  )}
                  {visible.map((column, colIndex) => {
                    const kind = column.skeleton ?? (column.numeric ? 'short' : 'text');
                    return (
                      <td
                        key={column.key}
                        data-col={column.key}
                        data-title={column.key === titleKey || undefined}
                        data-align={column.numeric ? 'end' : column.align}
                      >
                        {wrap(
                          column.key,
                          kind === 'none' ? null : kind === 'lines' ? (
                            <span className={s.skelLines}>
                              <span
                                className={s.skel}
                                style={{ width: `${skeletonWidth(rowIndex, colIndex) + 14}%` }}
                              />
                              <span
                                className={s.skel}
                                data-kind="sub"
                                style={{ width: `${skeletonWidth(rowIndex + 3, colIndex)}%` }}
                              />
                            </span>
                          ) : (
                            <span
                              className={s.skel}
                              data-kind={kind}
                              style={
                                kind === 'text'
                                  ? { width: `${skeletonWidth(rowIndex, colIndex)}%` }
                                  : undefined
                              }
                            />
                          ),
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            {mode === 'error' && (
              <tr>
                <td className={s.emptyCell} colSpan={span} role="alert">
                  {error}
                </td>
              </tr>
            )}
            {mode === 'empty' && (
              <tr>
                <td className={s.emptyCell} colSpan={span}>
                  {empty ?? 'Nenhum registro.'}
                </td>
              </tr>
            )}
            {mode === 'rows' &&
              rows.map((row) => {
                const key = rowKey(row);
                const isSelected = chosen.has(key);
                const isExiting = exiting?.has(key) ?? false;
                return (
                  <tr
                    key={key}
                    {...Object.fromEntries(
                      Object.entries(rowData?.(row) ?? {}).map(([name, value]) => [
                        `data-${name}`,
                        value,
                      ]),
                    )}
                    data-key={key}
                    data-selected={isSelected || undefined}
                    data-clickable={(Boolean(onRowClick) && !isExiting) || undefined}
                    data-pending={pending?.has(key) || undefined}
                    data-exiting={isExiting || undefined}
                    aria-hidden={isExiting || undefined}
                    aria-label={onRowClick && rowLabel ? rowLabel(row) : undefined}
                    tabIndex={onRowClick && !isExiting ? 0 : undefined}
                    onClick={
                      onRowClick && !isExiting
                        ? (event) => {
                            if (!isInteractiveTarget(event.target)) onRowClick(row);
                          }
                        : undefined
                    }
                    onKeyDown={
                      onRowClick && !isExiting
                        ? (event) => {
                            if (
                              event.target !== event.currentTarget ||
                              (event.key !== 'Enter' && event.key !== ' ')
                            )
                              return;
                            event.preventDefault();
                            onRowClick(row);
                          }
                        : undefined
                    }
                  >
                    {selectable && (
                      <td className={s.check}>
                        {exitWrap(
                          isExiting,
                          <Checkbox
                            aria-label={`Selecionar ${rowLabel ? rowLabel(row) : key}`}
                            checked={isSelected}
                            onChange={() => toggle(key)}
                          />,
                        )}
                      </td>
                    )}
                    {visible.map((column) => {
                      const rendered = column.render(row);
                      const value =
                        column.fallback !== undefined && isBlank(rendered) ? (
                          <span className={s.none}>{column.fallback}</span>
                        ) : (
                          rendered
                        );
                      const title = column.truncate
                        ? (column.title?.(row) ??
                          (typeof rendered === 'string' ? rendered : undefined))
                        : undefined;
                      return (
                        <td
                          key={column.key}
                          data-col={column.key}
                          data-label={
                            column.header === ''
                              ? undefined
                              : (column.name ??
                                (typeof column.header === 'string' ? column.header : undefined))
                          }
                          data-actions={column.header === '' || undefined}
                          data-title={column.key === titleKey || undefined}
                          data-blank={isBlank(value) || undefined}
                          data-align={column.numeric ? 'end' : column.align}
                          data-truncate={column.truncate || undefined}
                          className={column.numeric ? s.num : undefined}
                        >
                          {exitWrap(
                            isExiting,
                            wrap(
                              column.key,
                              column.truncate ? (
                                // O texto inteiro numa dica do DS, só quando a célula cortou.
                                title !== undefined ? (
                                  <TruncatedText className={s.truncate} text={title}>
                                    {value}
                                  </TruncatedText>
                                ) : (
                                  <span className={s.truncate}>{value}</span>
                                )
                              ) : (
                                value
                              ),
                            ),
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
          {totalRow && mode === 'rows' && (
            <tfoot>
              <tr>
                {selectable && <td className={s.check} />}
                {visible.map((column, index) =>
                  index === 0 ? (
                    <th
                      key={column.key}
                      scope="row"
                      data-col={column.key}
                      data-align={column.numeric ? 'end' : column.align}
                    >
                      {wrap(column.key, totalRow[column.key] ?? 'Total')}
                    </th>
                  ) : (
                    <td
                      key={column.key}
                      data-col={column.key}
                      data-align={column.numeric ? 'end' : column.align}
                      className={column.numeric ? s.num : undefined}
                    >
                      {wrap(column.key, totalRow[column.key])}
                    </td>
                  ),
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {footer}
    </div>
  );
}
/**
 * Menu “Colunas”: liga e desliga colunas sem fechar o painel (cada item é uma caixa de seleção).
 * Setas percorrem, Espaço/Enter alternam, Escape fecha e devolve o foco ao botão.
 */
export function ColumnsMenu<Row>({
  columns,
  hidden,
  onHiddenChange,
  label = 'Colunas',
  align = 'end',
}: {
  columns: Column<Row>[];
  hidden: ReadonlySet<string>;
  onHiddenChange: (next: Set<string>) => void;
  label?: string;
  align?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const items = columns
    .filter((column) => !column.pinned)
    .map((column) => ({
      key: column.key,
      name: column.name ?? (typeof column.header === 'string' ? column.header : column.key),
    }));
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);
  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = [...(panelRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const move = (to: number) => {
      event.preventDefault();
      buttons[(to + buttons.length) % buttons.length]?.focus();
    };
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === 'ArrowDown') move(index + 1);
    else if (event.key === 'ArrowUp') move(index - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(buttons.length - 1);
    else if (event.key === 'Tab') setOpen(false);
  }
  const shown = items.filter((item) => !hidden.has(item.key)).length;
  return (
    <span className={s.colsAnchor} ref={rootRef}>
      <Button
        ref={triggerRef}
        size="sm"
        icon={Columns3}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </Button>
      {open && (
        <div
          ref={panelRef}
          id={id}
          role="menu"
          aria-label={label}
          className={s.colsMenu}
          data-align={align}
          onKeyDown={onKey}
        >
          {items.map((item) => {
            const on = !hidden.has(item.key);
            const last = on && shown === 1;
            return (
              <button
                key={item.key}
                type="button"
                role="menuitemcheckbox"
                aria-checked={on}
                aria-disabled={last || undefined}
                tabIndex={-1}
                className={s.colsItem}
                onClick={() => {
                  if (last) return;
                  const next = new Set(hidden);
                  if (on) next.add(item.key);
                  else next.delete(item.key);
                  onHiddenChange(next);
                }}
              >
                <span className={s.colsBox} aria-hidden="true">
                  <Check />
                </span>
                {item.name}
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}

/* ——— Paginação ——— desenho e comportamento em `pagination.tsx` (dono: navegação). */
export { Pagination } from './pagination';

export type BulkAction = {
  label: string;
  icon: LucideIcon;
  danger?: boolean;
  /** Ação que não vale para a seleção atual; `hint` diz o porquê. */
  disabled?: boolean;
  hint?: string;
  onSelect: () => void;
};

/**
 * Barra escura de ações em lote (`--g-900`, `--shadow-dark`). Entra subindo 8 px (280 ms) quando há
 * seleção e sai em 160 ms quando ela acaba; o número troca por crossfade. `processing` mostra o
 * giro na ação em andamento e trava as demais. Escape limpa a seleção. `dock` prende a barra a
 * 16 px da base da janela.
 */
export function BulkBar({
  count,
  noun = 'selecionados',
  actions,
  onClear,
  processing,
  dock = false,
  clearLabel = 'Limpar seleção',
}: {
  count: number;
  noun?: string;
  actions: BulkAction[];
  onClear: () => void;
  /** Rótulo da ação em andamento (ex.: “Pausar”). */
  processing?: string;
  dock?: boolean;
  clearLabel?: string;
}) {
  const [prev, setPrev] = useState(count);
  const [shown, setShown] = useState(count);
  const [exiting, setExiting] = useState(false);
  if (prev !== count) {
    setPrev(count);
    if (count > 0) {
      setShown(count);
      setExiting(false);
    } else if (prev > 0) {
      setExiting(true);
    }
  }
  useEffect(() => {
    if (!exiting) return;
    const timer = window.setTimeout(() => setExiting(false), 160);
    return () => window.clearTimeout(timer);
  }, [exiting]);
  // Sem espaço (celular): some o substantivo; depois os ícones (o verbo diz mais que o desenho);
  // só no limite, os rótulos (ficam para leitor de tela).
  const barRef = useRef<HTMLDivElement>(null);
  const visible = count > 0 || exiting;
  useLayoutEffect(() => {
    const bar = barRef.current;
    const parent = bar?.parentElement;
    if (!bar || !parent) return;
    const fit = () => {
      let level = 0;
      bar.dataset.compact = '0';
      while (level < 3 && bar.scrollWidth > bar.clientWidth + 1) {
        level += 1;
        bar.dataset.compact = String(level);
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [visible, actions.length]);
  if (!visible) return null;

  const busy = Boolean(processing);
  const bar = (
    <div
      ref={barRef}
      className={s.bulk}
      role="toolbar"
      aria-label="Ações em lote"
      aria-busy={busy || undefined}
      data-exiting={exiting || undefined}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !busy) {
          event.preventDefault();
          onClear();
        }
      }}
    >
      <span className={s.bulkCount} aria-live="polite">
        <b key={shown}>{shown}</b>
        <span className={s.bulkNoun}>{noun}</span>
      </span>
      <span className={s.bulkActions}>
        {actions.map(({ label, icon: Icon, danger, disabled, hint, onSelect }) => {
          const running = processing === label;
          const button = (
            <button
              key={label}
              type="button"
              className={s.bulkAction}
              data-danger={danger || undefined}
              data-running={running || undefined}
              disabled={disabled || busy || exiting}
              aria-busy={running || undefined}
              onClick={onSelect}
            >
              {running ? (
                <LoaderCircle className={s.bulkSpin} aria-hidden="true" />
              ) : (
                <Icon aria-hidden="true" />
              )}
              <span className={s.bulkLabel}>{label}</span>
            </button>
          );
          return hint && disabled ? (
            <Tooltip key={label} content={hint}>
              {button}
            </Tooltip>
          ) : (
            button
          );
        })}
      </span>
      <Tooltip content={clearLabel} shortcut="Esc">
        <button
          type="button"
          className={`${s.bulkAction} ${s.bulkClear}`}
          aria-label={clearLabel}
          disabled={busy || exiting}
          onClick={onClear}
        >
          <X aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  );
  return dock ? <div className={s.bulkDock}>{bar}</div> : bar;
}

/**
 * Faixa acima das linhas quando a página inteira está marcada: oferece estender a seleção a todos
 * os resultados (“Selecionar todas as 17”) ou desfazê-la. Vai em `DataTable banner`.
 */
export function SelectAllBand({
  pageCount,
  total,
  allSelected = false,
  onSelectAll,
  onClear,
  selectedWord = 'selecionadas',
}: {
  pageCount: number;
  total: number;
  allSelected?: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  /** Particípio na concordância do item (“selecionadas”, “selecionados”). */
  selectedWord?: string;
}) {
  return (
    <div className={s.selectAll} role="status">
      {allSelected ? (
        <>
          <span>
            <b>{total}</b> {selectedWord}
          </span>
          <span className={s.selectAllDot} aria-hidden="true">
            ·
          </span>
          <button type="button" className={s.selectAllLink} onClick={onClear}>
            Limpar seleção
          </button>
        </>
      ) : (
        <>
          <span>
            <b>{pageCount}</b> {selectedWord} nesta página
          </span>
          <span className={s.selectAllDot} aria-hidden="true">
            ·
          </span>
          <button type="button" className={s.selectAllLink} onClick={onSelectAll}>
            Selecionar todas as {total}
          </button>
        </>
      )}
    </div>
  );
}
