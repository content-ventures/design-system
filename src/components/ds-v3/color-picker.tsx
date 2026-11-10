'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import f from './fields.module.css';
import { Floating, forcedOpen } from './select';
import s from './color-picker.module.css';

/** Doze cores de marca comuns em feiras: quentes, frias e neutras escuras. */
export const COLOR_PRESETS = [
  '#F28C28',
  '#E5484D',
  '#D6409F',
  '#8E4EC6',
  '#3E63DD',
  '#0875DB',
  '#0797B9',
  '#12A594',
  '#30A46C',
  '#C4A000',
  '#8D6748',
  '#2B303B',
];

const HEX = /^#?([0-9a-f]{6})$/i;
/** `#RRGGBB` em maiúsculas, ou `null`. */
export function normalizeHex(value: string) {
  const match = HEX.exec(value.trim());
  return match ? `#${(match[1] ?? '').toUpperCase()}` : null;
}

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}
/** Contraste WCAG entre duas cores `#RRGGBB`. */
export function contrastRatio(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
/** Contraste de texto branco sobre a cor — a leitura que o campo mostra. */
export function whiteTextContrast(hex: string) {
  return contrastRatio(hex, '#FFFFFF');
}
const ratioText = (n: number) =>
  `${(Math.floor(n * 10) / 10).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}:1`;

export type ColorFieldProps = {
  id?: string;
  /** `#RRGGBB`. */
  value: string;
  onChange: (value: string) => void;
  presets?: string[];
  /** Nome acessível quando não há <label for>. */
  label?: string;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
  /** Fundo/texto contra o qual medir o contraste (padrão: branco — texto branco sobre a cor). */
  contrastAgainst?: string;
  /** Mensagem do que foi digitado ("Use o formato #RRGGBB") ou `null` quando vale. */
  onInputError?: (message: string | null) => void;
  /** Prancha: `hover`, `focus` ou `open` (painel aberto e parado). */
  'data-force'?: string;
  /** Prancha: cor do painel com o hover desenhado. */
  hoverColor?: string;
};

/** Mensagem do código fora do formato, no campo e na cor personalizada do painel. */
export const HEX_FORMAT_MESSAGE = 'Use o formato #RRGGBB';

/** O que se digita no código: maiúsculas, só `#` e hexadecimais, com o `#` na frente, até 7. */
export function cleanHexInput(raw: string) {
  const clean = raw.toUpperCase().replace(/[^#0-9A-F]/g, '');
  const next = clean.startsWith('#')
    ? `#${clean.slice(1).replace(/#/g, '')}`
    : clean
      ? `#${clean}`
      : '';
  return next.slice(0, 7);
}

/**
 * Cor de marca por código: amostra + hexadecimal digitável. O painel traz doze cores prontas, a
 * cor personalizada (o seletor nativo do sistema e o código `#RRGGBB`, para a cor do manual que não
 * está entre as prontas) e a leitura de contraste com texto branco ("4,6:1 · AA"), que acompanha a
 * cor personalizada enquanto se digita. Sem transparência.
 *
 * Teclado: Enter/↓ na amostra abre o painel com o foco na cor escolhida (ou na primeira). As setas
 * percorrem a grade (Home/End vão às pontas) e a leitura acompanha a cor em foco; Enter/Espaço
 * escolhem, fecham e devolvem o foco à amostra. Tab vai da grade ao seletor e ao código da cor
 * personalizada (Enter no código aplica e fecha); depois do último, Tab sai para o código do campo e
 * Shift+Tab, da grade, volta à amostra, fechando o painel. Escape fecha e devolve. O painel fica
 * logo depois do campo no DOM (ordem do leitor de tela).
 */
export function ColorField({
  id,
  value,
  onChange,
  presets = COLOR_PRESETS,
  label,
  invalid,
  disabled,
  describedBy,
  contrastAgainst = '#FFFFFF',
  onInputError,
  'data-force': force,
  hoverColor,
}: ColorFieldProps) {
  const auto = useId();
  const inputId = id ?? `${auto}-input`;
  const panelId = `${auto}-panel`;
  const boxRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const nativeRef = useRef<HTMLInputElement>(null);
  const customRef = useRef<HTMLInputElement>(null);
  const focusOnOpen = useRef(false);
  const customId = `${auto}-custom`;
  const customErrorId = `${auto}-custom-error`;
  const pinned = forcedOpen(force);
  const [openState, setOpen] = useState(false);
  const open = openState || pinned;
  const color = normalizeHex(value) ?? '#FFFFFF';
  const [text, setText] = useState(normalizeHex(value) ?? value);
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setText(normalizeHex(value) ?? value);
  }
  const typed = normalizeHex(text);
  const live = typed ?? color;
  /** O código da cor personalizada: segue a cor do campo até alguém digitar nele. */
  const [customText, setCustomText] = useState(normalizeHex(value) ?? '');
  const [customError, setCustomError] = useState(false);
  const [customSynced, setCustomSynced] = useState(value);
  if (customSynced !== value) {
    setCustomSynced(value);
    const hex = normalizeHex(value);
    if (hex) {
      setCustomText(hex);
      setCustomError(false);
    }
  }
  /** Cor sob o ponteiro e cor em foco na grade: a leitura do painel mostra a que se está olhando. */
  const [pointed, setPointed] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const staticHover = pinned && hoverColor ? normalizeHex(hoverColor) : null;
  const shown = pointed ?? staticHover ?? focused ?? live;
  const ratio = contrastRatio(shown, normalizeHex(contrastAgainst) ?? '#FFFFFF');
  const passes = ratio >= 4.5;

  const selectedIndex = presets.findIndex((preset) => normalizeHex(preset) === color);
  const [cursor, setCursor] = useState(0);
  const home = selectedIndex >= 0 ? selectedIndex : 0;

  /** Vale a cor: o texto acompanha o `value` controlado (a sincronização acima). */
  function apply(next: string) {
    const hex = normalizeHex(next);
    if (!hex) return;
    onInputError?.(null);
    if (hex !== normalizeHex(value)) onChange(hex);
    else setText(hex);
  }
  function commitText() {
    const raw = text.trim();
    if (!raw) {
      setText(normalizeHex(value) ?? '');
      onInputError?.(null);
      return;
    }
    const hex = normalizeHex(raw);
    if (!hex) {
      onInputError?.(HEX_FORMAT_MESSAGE);
      return;
    }
    apply(hex);
  }
  function onText(raw: string) {
    const next = cleanHexInput(raw);
    setText(next);
    const hex = normalizeHex(next);
    // Com seis dígitos válidos, a cor já vale: amostra e prévia acompanham a digitação.
    if (hex) apply(hex);
  }
  /** Cor personalizada: com seis dígitos, já vale (amostra, leitura e prévia acompanham). */
  function onCustomText(raw: string) {
    const next = cleanHexInput(raw);
    setCustomText(next);
    const hex = normalizeHex(next);
    if (hex) {
      setCustomError(false);
      apply(hex);
    }
  }
  /** Enter ou saída do código personalizado: incompleto vira o erro, nunca uma cor pela metade. */
  function commitCustom() {
    const hex = normalizeHex(customText);
    if (!hex) {
      setCustomError(customText.trim() !== '');
      return false;
    }
    setCustomError(false);
    apply(hex);
    return true;
  }
  function show() {
    if (disabled || openState) return;
    focusOnOpen.current = true;
    setCursor(home);
    setOpen(true);
  }
  /** `restore`: devolve o foco à amostra (Escape, escolha). `false`: o foco já foi para outro lugar. */
  function close(restore: boolean | HTMLElement | null) {
    setOpen(false);
    setPointed(null);
    setFocused(null);
    setCustomError(false);
    setCustomText(normalizeHex(value) ?? '');
    const target = restore === true ? triggerRef.current : restore || null;
    target?.focus({ preventScroll: true });
  }
  function choose(hex: string) {
    apply(hex);
    close(true);
  }

  // Abriu pelo gatilho ou pelo teclado: o foco entra na cor escolhida (ou na primeira).
  useEffect(() => {
    if (!openState || !focusOnOpen.current) return;
    focusOnOpen.current = false;
    gridRef.current
      ?.querySelectorAll<HTMLButtonElement>('button')
      [home]?.focus({ preventScroll: true });
  }, [openState, home]);

  function onGridKey(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = [...(gridRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    const cols = 6;
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      ArrowDown: index + cols,
      ArrowUp: index - cols,
      Home: 0,
      End: buttons.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const at = Math.max(0, Math.min(buttons.length - 1, next));
    setCursor(at);
    buttons[at]?.focus();
  }

  return (
    <>
      <div
        ref={boxRef}
        className={`${f.control} ${s.box}`}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-open={open || undefined}
        data-force={force}
      >
        <button
          ref={triggerRef}
          type="button"
          className={s.swatchButton}
          aria-label="Escolher cor"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          disabled={disabled}
          onClick={() => (open ? close(false) : show())}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && !open) {
              event.preventDefault();
              show();
            }
          }}
        >
          <span className={s.swatch} style={{ '--swatch': live } as CSSProperties} />
        </button>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          autoComplete="off"
          spellCheck={false}
          maxLength={7}
          disabled={disabled}
          aria-label={label}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          value={text}
          placeholder="#RRGGBB"
          onChange={(event) => onText(event.target.value)}
          onBlur={commitText}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitText();
            } else if (event.key === 'ArrowDown' && !open) {
              event.preventDefault();
              show();
            }
          }}
        />
        <button
          type="button"
          className={s.toggle}
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          onClick={() => (open ? close(false) : show())}
        >
          <ChevronDown />
        </button>
      </div>
      <Floating
        anchorRef={boxRef}
        open={open && !disabled}
        inline={pinned}
        portal={false}
        onDismiss={() => close(false)}
        width="auto"
        className={s.panel}
        id={panelId}
        role="dialog"
        aria-label="Cores da marca"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            close(true);
          } else if (event.key === 'Tab' && !pinned) {
            // Três paradas (a grade, o seletor e o código da cor personalizada); das pontas, Tab
            // segue para o código do campo e Shift+Tab volta à amostra, fechando o painel.
            const target = event.target as Node;
            const stops = [gridRef.current, nativeRef.current, customRef.current];
            const at = stops.findIndex((stop) => stop?.contains(target));
            const next = at < 0 ? null : stops[at + (event.shiftKey ? -1 : 1)];
            event.preventDefault();
            if (next === gridRef.current) {
              gridRef.current
                ?.querySelectorAll<HTMLButtonElement>('button')
                [cursor]?.focus({ preventScroll: true });
            } else if (next) next.focus({ preventScroll: true });
            else close(event.shiftKey ? triggerRef.current : inputRef.current);
          }
        }}
      >
        <div
          className={s.body}
          onBlur={(event) => {
            // O foco saiu do painel por outro caminho (clique num campo, atalho): fecha junto.
            const next = event.relatedTarget;
            if (!next || pinned || event.currentTarget.contains(next)) return;
            if (!boxRef.current?.contains(next)) close(false);
          }}
        >
          <div
            ref={gridRef}
            className={s.grid}
            role="group"
            aria-label="Cores prontas"
            onKeyDown={onGridKey}
            onPointerLeave={() => setPointed(null)}
            onBlur={(event) => {
              if (gridRef.current?.contains(event.relatedTarget)) return;
              setFocused(null);
            }}
          >
            {presets.map((preset, index) => {
              const hex = normalizeHex(preset) ?? preset;
              const selected = hex === color;
              return (
                <button
                  key={hex}
                  type="button"
                  className={s.preset}
                  style={{ '--swatch': hex } as CSSProperties}
                  aria-label={hex}
                  aria-pressed={selected}
                  data-force={staticHover === hex ? 'hover' : undefined}
                  tabIndex={index === (openState ? cursor : home) ? 0 : -1}
                  onPointerEnter={() => setPointed(hex)}
                  onFocus={() => {
                    setCursor(index);
                    setFocused(hex);
                  }}
                  onClick={() => (pinned ? apply(hex) : choose(hex))}
                />
              );
            })}
          </div>
          <div className={s.custom}>
            <label className={s.customLabel} htmlFor={customId}>
              Cor personalizada
            </label>
            <span className={s.customRow}>
              <input
                ref={nativeRef}
                type="color"
                className={s.native}
                aria-label="Escolher no seletor do sistema"
                value={live.toLowerCase()}
                onChange={(event) => {
                  const hex = normalizeHex(event.target.value);
                  if (!hex) return;
                  setCustomText(hex);
                  setCustomError(false);
                  apply(hex);
                }}
              />
              <input
                ref={customRef}
                id={customId}
                type="text"
                className={s.customInput}
                autoComplete="off"
                spellCheck={false}
                maxLength={7}
                placeholder="#RRGGBB"
                aria-invalid={customError || undefined}
                aria-describedby={customError ? customErrorId : undefined}
                value={customText}
                onChange={(event) => onCustomText(event.target.value)}
                onBlur={() => {
                  commitCustom();
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return;
                  event.preventDefault();
                  if (commitCustom() && !pinned) close(true);
                }}
              />
            </span>
            {customError ? (
              <span id={customErrorId} className={s.customError}>
                {HEX_FORMAT_MESSAGE}
              </span>
            ) : null}
          </div>
          <div className={s.readout}>
            <span
              className={s.readoutSwatch}
              style={{ '--swatch': shown } as CSSProperties}
              aria-hidden="true"
            />
            <span className={s.hex}>{shown}</span>
            <span className={s.contrast} data-pass={passes || undefined} aria-live="polite">
              <span
                className={s.contrastDemo}
                style={{ '--swatch': shown } as CSSProperties}
                aria-hidden="true"
              >
                Aa
              </span>
              {ratioText(ratio)} · {ratio >= 7 ? 'AAA' : passes ? 'AA' : 'Baixo'}
            </span>
          </div>
        </div>
      </Floating>
    </>
  );
}
