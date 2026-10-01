'use client';

import type { ComponentProps } from 'react';
import { Input } from './fields';
import s from './inputs.module.css';

/** Valor exato em reais, sempre com 2 casas: 18.000,00 (sem o “R$”). */
export const formatMoney = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Dinheiro exato com o símbolo: R$ 18.000,00. */
export const moneyBRL = (value: number) => `R$ ${formatMoney(value)}`;

/**
 * Lê o que se cola num campo de dinheiro: “18.000,00”, “18000,5”, “R$ 18.000”, “18000” (reais)
 * ou “18000.50”. Vazio ou inválido → null.
 */
export function parseMoney(text: string): number | null {
  const clean = text.replace(/R\$|\s/g, '');
  if (!clean) return null;
  let normal: string;
  if (/,\d{1,2}$/.test(clean)) normal = clean.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(clean)) normal = clean.replace(/\./g, '');
  else if (/^\d+\.\d{1,2}$/.test(clean)) normal = clean;
  else normal = clean.replace(/[^\d]/g, '');
  const value = Number(normal);
  return normal && Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

export type MoneyAdjustReason = 'min' | 'max' | 'multiple';

export type MoneyFieldProps = Omit<
  ComponentProps<'input'>,
  | 'value'
  | 'onChange'
  | 'size'
  | 'prefix'
  | 'type'
  | 'min'
  | 'max'
  | 'step'
  | 'defaultValue'
  | 'multiple'
> & {
  /** Reais, com 2 casas. `null` = vazio. */
  value: number | null;
  onChange: (value: number | null) => void;
  /** `hero`: 56 px, valor na régua do título da página (bloco de verba). */
  size?: 'sm' | 'md' | 'hero';
  min?: number;
  max?: number;
  /** Múltiplo aceito (ex.: preço do CPM). Setas andam um múltiplo; ao sair, arredonda. */
  multiple?: number;
  /** Ao sair do campo o valor foi ajustado (mínimo, máximo ou múltiplo). */
  onAdjust?: (next: number, typed: number, reason: MoneyAdjustReason) => void;
  invalid?: boolean;
};

/**
 * Dinheiro em reais com máscara de centavos: os dígitos entram pela direita (1 → 0,01 → 0,18 …).
 * Colar “18000” ou “18.000,00” funciona. Setas ±múltiplo (Shift ×10). Ao sair, arredonda ao
 * múltiplo e aos limites e chama `onAdjust` para o campo dizer o que mudou.
 */
export function MoneyField({
  value,
  onChange,
  size = 'md',
  min,
  max,
  multiple,
  onAdjust,
  invalid,
  placeholder = '0,00',
  className = '',
  ...props
}: MoneyFieldProps) {
  const snap = (raw: number) => {
    let next = multiple ? Math.round(raw / multiple) * multiple : raw;
    if (min !== undefined) next = Math.max(next, min);
    if (max !== undefined) next = Math.min(next, max);
    return Math.round(next * 100) / 100;
  };
  const locked = props.disabled || props.readOnly;

  return (
    <Input
      {...props}
      size={size === 'sm' ? 'sm' : 'md'}
      className={`${s.money} ${size === 'hero' ? s.moneyHero : ''} ${className}`}
      prefix="R$"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      invalid={invalid}
      value={value === null ? '' : formatMoney(value)}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 13);
        onChange(digits ? Number(digits) / 100 : null);
      }}
      onPaste={(event) => {
        props.onPaste?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        const pasted = parseMoney(event.clipboardData.getData('text'));
        if (pasted !== null) onChange(pasted);
      }}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (event.defaultPrevented || locked) return;
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        event.preventDefault();
        const unit = (multiple ?? 1) * (event.shiftKey ? 10 : 1);
        const base = value ?? (min !== undefined ? min - (event.key === 'ArrowUp' ? unit : 0) : 0);
        onChange(snap(base + (event.key === 'ArrowUp' ? unit : -unit)));
      }}
      onBlur={(event) => {
        if (value !== null && value > 0) {
          const next = snap(value);
          if (Math.abs(next - value) > 0.004) {
            onChange(next);
            onAdjust?.(
              next,
              value,
              min !== undefined && value < min
                ? 'min'
                : max !== undefined && value > max
                  ? 'max'
                  : 'multiple',
            );
          }
        }
        props.onBlur?.(event);
      }}
    />
  );
}
