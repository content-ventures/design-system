'use client';

import { ArrowBigUp, Check, Eye, EyeOff } from 'lucide-react';
import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { ControlButton, Input, type InputProps } from './fields';
import s from './inputs.module.css';

export type PasswordRequirement = { label: string; test: (value: string) => boolean };

const LEVEL_LABEL = ['', 'Fraca', 'Razoável', 'Forte'] as const;

/**
 * Senha com olho (mostrar/ocultar), aviso de Caps Lock e, na criação, requisitos ao vivo com
 * medidor de 4 segmentos. Vazia, o medidor fica cinza: nunca vermelho em repouso.
 */
export function PasswordField({
  value,
  onValueChange,
  requirements,
  invalid,
  capsLock: capsForced,
  visible: visibleForced,
  className = '',
  ...props
}: Omit<InputProps, 'type' | 'value' | 'onChange' | 'trailing' | 'suffix' | 'status' | 'icon'> & {
  value: string;
  onValueChange: (value: string) => void;
  /** Criação de senha: cada regra vira uma linha que marca quando atendida. */
  requirements?: PasswordRequirement[];
  /** Pranchas: força o aviso de Caps Lock. Sem valor, detecta pelo teclado. */
  capsLock?: boolean;
  /** Pranchas: força a senha visível. */
  visible?: boolean;
}) {
  const [shown, setShown] = useState(false);
  const [caps, setCaps] = useState(false);
  const isShown = visibleForced ?? shown;
  const isCaps = capsForced ?? caps;

  const detect = (event: KeyboardEvent<HTMLInputElement> | MouseEvent<HTMLInputElement>) => {
    if (typeof event.getModifierState === 'function') setCaps(event.getModifierState('CapsLock'));
  };

  const met = requirements?.map((rule) => rule.test(value)) ?? [];
  const total = met.length;
  const score = met.filter(Boolean).length;
  const filled = value && total ? Math.round((score / total) * 4) : 0;
  const level = !value || !total || !score ? 0 : score === total ? 3 : score >= total / 2 ? 2 : 1;

  return (
    <div className={`${s.password} ${className}`}>
      <Input
        {...props}
        type={isShown ? 'text' : 'password'}
        value={value}
        invalid={invalid}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete={props.autoComplete ?? (requirements ? 'new-password' : 'current-password')}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          detect(event);
          props.onKeyDown?.(event);
        }}
        onKeyUp={(event) => {
          detect(event);
          props.onKeyUp?.(event);
        }}
        onMouseDown={(event) => {
          detect(event);
          props.onMouseDown?.(event);
        }}
        onBlur={(event) => {
          setCaps(false);
          props.onBlur?.(event);
        }}
        trailing={
          <ControlButton
            label="Mostrar senha"
            tip={isShown ? 'Ocultar senha' : 'Mostrar senha'}
            icon={isShown ? EyeOff : Eye}
            aria-pressed={isShown}
            disabled={props.disabled}
            onClick={() => setShown((current) => !current)}
          />
        }
      />
      <div className={s.reveal} data-open={isCaps || undefined}>
        <div>
          <p className={s.caps} role={isCaps ? 'status' : undefined}>
            <ArrowBigUp aria-hidden="true" />
            Caps Lock ativado
          </p>
        </div>
      </div>
      {requirements && (
        <div className={s.strength}>
          <span className={s.segments} data-level={level} aria-hidden="true">
            {[0, 1, 2, 3].map((index) => (
              <i key={index} data-on={index < filled || undefined} />
            ))}
          </span>
          <span className={s.srOnly} aria-live="polite">
            {level ? `Senha ${LEVEL_LABEL[level].toLowerCase()}` : ''}
          </span>
          <ul className={s.rules} aria-label="Requisitos da senha">
            {requirements.map((rule, index) => (
              <li key={rule.label} data-met={met[index] || undefined}>
                <span className={s.ruleMark} aria-hidden="true">
                  <i />
                  <Check strokeWidth={2.5} />
                </span>
                {rule.label}
                <span className={s.srOnly}>{met[index] ? ', atendido' : ', pendente'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
