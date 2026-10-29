import { useId, type ReactNode } from 'react';
import s from './danger-zone.module.css';

/**
 * Zona de perigo: o lugar das ações destrutivas de uma tela ou diálogo, fora do rodapé.
 * Título textual visível e contorno vermelho, sem fundo sólido — a identificação não depende
 * só da cor. As ações dentro dela usam `Button variant="danger-soft"`; o vermelho sólido fica
 * reservado à confirmação da ação. O DS só desenha: quem decide se a ação existe é o servidor.
 */
export function DangerZone({
  title = 'Zona de perigo',
  description,
  children,
}: {
  title?: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();
  return (
    <section
      className={s.zone}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      data-danger-zone
    >
      <h3 id={titleId} className={s.title}>
        {title}
      </h3>
      {description && (
        <p id={descriptionId} className={s.description}>
          {description}
        </p>
      )}
      <div className={s.actions}>{children}</div>
    </section>
  );
}
