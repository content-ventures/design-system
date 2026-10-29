import { Children, useId, type ReactNode } from 'react';
import { Settings } from 'lucide-react';
import { Badge, type Tone } from './badge';
import { Button, ButtonLink } from './button';
import s from './entity-sheet.module.css';

/** Ação da ficha: link (`href`) ou botão (`onClick`, ou `type="submit"` de um `form`). */
export interface EntitySheetAction {
  rotulo: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  form?: string;
  disabled?: boolean;
  loading?: boolean;
}

export interface EntitySheetProps {
  titulo: ReactNode;
  /** Estado em texto, com ponto (ou anel, no tom `gray`): nunca só cor. */
  selo: { texto: string; tom: Tone };
  /** A única ação principal da ficha. */
  acaoPrincipal: EntitySheetAction;
  acoesSecundarias?: ReactNode;
  /** O `⚙ Configurações` da entidade. */
  configuracoes?: Omit<EntitySheetAction, 'rotulo'> & { rotulo?: ReactNode };
  /** Bloco de pendências; vazio, não entra no DOM. */
  pendencias?: ReactNode;
  /** Conteúdo da entidade (fila, seções). */
  children?: ReactNode;
}

function Action({
  action,
  variant,
  icon,
}: {
  action: EntitySheetAction;
  variant: 'primary' | 'ghost';
  icon?: typeof Settings;
}) {
  if (action.href && !action.disabled)
    return (
      <ButtonLink href={action.href} variant={variant} icon={icon}>
        {action.rotulo}
      </ButtonLink>
    );
  return (
    <Button
      variant={variant}
      icon={icon}
      type={action.type ?? 'button'}
      form={action.form}
      onClick={action.onClick}
      aria-disabled={action.disabled || undefined}
      loading={action.loading}
    >
      {action.rotulo}
    </Button>
  );
}

/**
 * Ficha de entidade: a página de detalhe de um registro (um cadastro, uma página pública).
 * Título, selo de estado em texto ao lado, uma só ação principal, ações secundárias,
 * `⚙ Configurações`, bloco de pendências e conteúdo, nessa ordem. O DS só desenha: quem decide a
 * ação e as pendências é o servidor.
 */
export function EntitySheet({
  titulo,
  selo,
  acaoPrincipal,
  acoesSecundarias,
  configuracoes,
  pendencias,
  children,
}: EntitySheetProps) {
  const titleId = useId();
  const hasPendencias = Children.toArray(pendencias).length > 0;
  return (
    <section className={s.sheet} aria-labelledby={titleId} data-entity-sheet>
      <header className={s.header}>
        <div className={s.identity}>
          <h1 id={titleId} className={s.title}>
            {titulo}
          </h1>
          <Badge variant="text" tone={selo.tom} dot={selo.tom === 'gray' ? 'hollow' : true}>
            {selo.texto}
          </Badge>
        </div>
        <div className={s.actions} data-entity-sheet-actions>
          <Action action={acaoPrincipal} variant="primary" />
          {acoesSecundarias}
          {configuracoes && (
            <Action
              action={{ ...configuracoes, rotulo: configuracoes.rotulo ?? 'Configurações' }}
              variant="ghost"
              icon={Settings}
            />
          )}
        </div>
      </header>
      {hasPendencias && (
        <div className={s.pending} data-entity-sheet-pendencias>
          {pendencias}
        </div>
      )}
      {children !== undefined && children !== null && <div className={s.content}>{children}</div>}
    </section>
  );
}
