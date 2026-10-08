/**
 * Formatos de texto do contrato (§11) que não pertencem a um componente: tempo relativo e
 * contagens de um texto. Funções puras, sem `Intl` dependente do ambiente — o servidor e o
 * navegador devolvem a mesma string para a mesma entrada.
 */

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Dias de calendário (local) entre duas datas: hoje → 0, ontem → 1, amanhã → −1. */
function calendarDays(from: Date, to: Date) {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / DAY);
}

/**
 * Tempo relativo em pt-BR (contrato §11): “agora”, “há 2 min”, “há 2 h”, “ontem”, “há 3 dias”;
 * a partir de 7 dias, data curta (“12 out”; com o ano quando não é o de `now`: “12 out 2025”).
 * Futuro espelha: “em 5 min”, “em 3 h”, “amanhã”, “em 3 dias”. Data inválida → “—”.
 * `now` fixo deixa o resultado estável em teste e na renderização do servidor.
 */
export function formatRelative(date: Date | string | number, now: Date = new Date()): string {
  const value = date instanceof Date ? date : new Date(date);
  const time = value.getTime();
  const base = now.getTime();
  if (Number.isNaN(time) || Number.isNaN(base)) return '—';
  const diff = base - time;
  const ahead = diff < 0;
  const span = Math.abs(diff);
  if (span < MINUTE) return 'agora';
  if (span < HOUR) {
    const minutes = Math.floor(span / MINUTE);
    return ahead ? `em ${minutes} min` : `há ${minutes} min`;
  }
  if (span < DAY) {
    const hours = Math.floor(span / HOUR);
    return ahead ? `em ${hours} h` : `há ${hours} h`;
  }
  const days = Math.abs(calendarDays(value, now));
  if (days <= 1) return ahead ? 'amanhã' : 'ontem';
  if (days < 7) return ahead ? `em ${days} dias` : `há ${days} dias`;
  const short = `${value.getDate()} ${MONTHS[value.getMonth()]}`;
  return value.getFullYear() === now.getFullYear() ? short : `${short} ${value.getFullYear()}`;
}

export type TextStats = {
  /** Palavras: trechos separados por espaço com ao menos uma letra ou número (“R$ 18.000,00” = 2). */
  words: number;
  /** Caracteres com espaços, sem quebras de linha (contagem de lauda). */
  characters: number;
  /** Leitura a 200 palavras por minuto, arredondada; mínimo 1 quando há texto, 0 quando vazio. */
  readingMinutes: number;
};

const WORD = /[\p{L}\p{N}]/u;

/** Contagens de um texto corrido (extensão do artigo, tempo de leitura). */
export function textStats(text: string): TextStats {
  const clean = (text ?? '').normalize('NFC');
  const words = clean.split(/\s+/).filter((token) => WORD.test(token)).length;
  const characters = [...clean.replace(/[\r\n]/g, '')].length;
  const readingMinutes = words > 0 ? Math.max(1, Math.round(words / 200)) : 0;
  return { words, characters, readingMinutes };
}
