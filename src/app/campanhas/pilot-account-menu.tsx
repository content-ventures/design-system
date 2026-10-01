'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown, LogOut, Monitor, Settings2, UserRound, X } from 'lucide-react';
import c from './campaign-shell.module.css';

function AccountAvatar() {
  return (
    <Image
      className={c.avatar}
      src="/images/avatar-demo.png"
      alt="Avatar fictício de demonstração"
      width={36}
      height={36}
      sizes="36px"
    />
  );
}

export function PilotAccountMenu({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus({ preventScroll: true });
    const pointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      trigger.current?.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', pointerDown);
    // Fecha primeiro a conta, sem fechar também a navegação móvel.
    document.addEventListener('keydown', keyDown, true);
    return () => {
      document.removeEventListener('pointerdown', pointerDown);
      document.removeEventListener('keydown', keyDown, true);
    };
  }, [open]);

  return (
    <div
      className={c.accountSection}
      ref={container}
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget))
          setOpen(false);
      }}
    >
      <button
        className={c.accountTrigger}
        ref={trigger}
        aria-label="Conta: Equipe de mídia"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? 'conta-demonstracao' : undefined}
        title={collapsed ? 'Equipe de mídia · Francal' : undefined}
        onClick={() => setOpen(!open)}
      >
        <AccountAvatar />
        <span className={c.accountIdentity}>
          <strong>Equipe de mídia</strong>
          <span>Francal · Demonstração</span>
        </span>
        <ChevronsUpDown className={c.accountChevron} size={16} aria-hidden="true" />
      </button>
      {open && (
        <div
          className={c.accountPopover}
          role="dialog"
          aria-label="Conta de demonstração"
          id="conta-demonstracao"
        >
          <div className={c.accountPopoverHeader}>
            <span>Conta atual</span>
            <button
              ref={closeButton}
              className={c.accountClose}
              aria-label="Fechar opções da conta"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus({ preventScroll: true });
              }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <div className={c.accountCurrent}>
            <AccountAvatar />
            <span className={c.accountIdentity}>
              <strong>Equipe de mídia</strong>
              <span>Francal · Demonstração</span>
            </span>
            <Check size={15} aria-hidden="true" />
          </div>
          <div className={c.accountActions}>
            {[
              { label: 'Meu perfil', Icon: UserRound },
              { label: 'Configurações da conta', Icon: Settings2 },
              { label: 'Dispositivos conectados', Icon: Monitor },
              { label: 'Sair da conta', Icon: LogOut },
            ].map(({ label, Icon }) => (
              <button
                key={label}
                disabled
                title="Indisponível na demonstração. Nenhuma conta real está conectada."
              >
                <Icon size={17} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          <div className={c.accountPopoverFooter}>
            <strong>MediaOn</strong>
            <span>Prévia sem autenticação</span>
          </div>
        </div>
      )}
    </div>
  );
}
