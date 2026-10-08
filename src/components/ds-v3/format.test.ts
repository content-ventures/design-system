/**
 * Formatos do contrato §11: tempo relativo (“há 2 h”) e contagens de texto. `now` fixo em hora local
 * para o calendário (ontem, dias) não depender do fuso da máquina.
 */
import { describe, expect, it } from 'vitest';

import { formatRelative, textStats } from './format';

const now = new Date(2026, 9, 7, 15, 30, 0);
const ago = (ms: number) => new Date(now.getTime() - ms);
const MIN = 60_000;
const H = 60 * MIN;

describe('formatRelative', () => {
  it('menos de um minuto é “agora”', () => {
    expect(formatRelative(now, now)).toBe('agora');
    expect(formatRelative(ago(59_000), now)).toBe('agora');
  });

  it('minutos e horas no mesmo dia', () => {
    expect(formatRelative(ago(2 * MIN), now)).toBe('há 2 min');
    expect(formatRelative(ago(59 * MIN), now)).toBe('há 59 min');
    expect(formatRelative(ago(2 * H), now)).toBe('há 2 h');
    expect(formatRelative(ago(23 * H + 59 * MIN), now)).toBe('há 23 h');
  });

  it('ontem, dias e depois data curta', () => {
    expect(formatRelative(new Date(2026, 9, 6, 22, 0), now)).toBe('há 17 h');
    expect(formatRelative(new Date(2026, 9, 6, 9, 0), now)).toBe('ontem');
    expect(formatRelative(new Date(2026, 9, 4, 18, 0), now)).toBe('há 3 dias');
    expect(formatRelative(new Date(2026, 9, 1, 8, 0), now)).toBe('há 6 dias');
    expect(formatRelative(new Date(2026, 8, 30, 8, 0), now)).toBe('30 set');
    expect(formatRelative(new Date(2025, 9, 12, 8, 0), now)).toBe('12 out 2025');
  });

  it('aceita ISO e timestamp; data inválida vira “—”', () => {
    expect(formatRelative(ago(5 * MIN).toISOString(), now)).toBe('há 5 min');
    expect(formatRelative(ago(3 * H).getTime(), now)).toBe('há 3 h');
    expect(formatRelative('não é data', now)).toBe('—');
  });

  it('futuro espelha o passado', () => {
    expect(formatRelative(new Date(now.getTime() + 5 * MIN), now)).toBe('em 5 min');
    expect(formatRelative(new Date(now.getTime() + 3 * H), now)).toBe('em 3 h');
    expect(formatRelative(new Date(2026, 9, 8, 18, 0), now)).toBe('amanhã');
    expect(formatRelative(new Date(2026, 9, 11, 9, 0), now)).toBe('em 4 dias');
  });
});

describe('textStats', () => {
  it('texto vazio não tem leitura', () => {
    expect(textStats('')).toEqual({ words: 0, characters: 0, readingMinutes: 0 });
    expect(textStats('  \n — ')).toMatchObject({ words: 0, readingMinutes: 0 });
  });

  it('conta palavras com letra ou número; pontuação solta não conta', () => {
    const stats = textStats('A feira começa — em São Paulo — com verba de R$ 18.000,00.');
    expect(stats.words).toBe(11);
  });

  it('caracteres com espaços, sem quebras de linha', () => {
    expect(textStats('Olá\nmundo').characters).toBe(8);
    expect(textStats('ação').characters).toBe(4);
    // Decomposta (c + cedilha, a + til): normalizada para NFC antes de contar.
    expect(textStats('ac\u0327a\u0303o').characters).toBe(4);
  });

  it('leitura a 200 palavras por minuto, mínimo 1', () => {
    expect(textStats('Uma frase curta.').readingMinutes).toBe(1);
    expect(textStats(Array.from({ length: 812 }, () => 'palavra').join(' ')).readingMinutes).toBe(
      4,
    );
    expect(textStats(Array.from({ length: 1200 }, () => 'palavra').join(' ')).readingMinutes).toBe(
      6,
    );
  });
});
