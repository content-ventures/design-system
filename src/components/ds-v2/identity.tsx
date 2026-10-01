'use client';

import { useState } from 'react';
import { Check, UserRound } from 'lucide-react';
import s from './patterns.module.css';

export type AvatarProps = {
  name: string;
  src?: string;
  size?: 24 | 32 | 40 | 48;
  shape?: 'circle' | 'square';
  presence?: 'online' | 'offline';
  verified?: boolean;
  notification?: number;
  loading?: boolean;
  tone?: 'blue' | 'green' | 'amber' | 'neutral';
  fallback?: 'initials' | 'icon';
};

export function Avatar({
  name,
  src,
  size = 32,
  shape = 'circle',
  presence,
  verified,
  notification,
  loading,
  tone = 'blue',
  fallback = 'initials',
}: AvatarProps) {
  const [failedSource, setFailedSource] = useState<string>();
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const state = loading
    ? 'carregando'
    : verified
      ? 'verificado'
      : notification
        ? `${notification} notificações`
        : presence === 'online'
          ? 'online'
          : presence === 'offline'
            ? 'offline'
            : '';
  return (
    <span
      className={s.avatar}
      data-shape={shape}
      data-tone={tone}
      data-loading={loading || undefined}
      style={{ width: size, height: size, fontSize: size < 40 ? 10 : 13 }}
      role="img"
      aria-label={[name, state].filter(Boolean).join(', ')}
      title={name}
    >
      {src && failedSource !== src ? (
        // eslint-disable-next-line @next/next/no-img-element -- Avatar local ou fornecido pelo consumidor, com fallback de carregamento.
        <img src={src} alt="" onError={() => setFailedSource(src)} />
      ) : fallback === 'icon' || !initials ? (
        <UserRound size={size / 2} aria-hidden="true" />
      ) : (
        initials
      )}
      {state && !loading && (
        <span
          className={s.avatarBadge}
          data-state={verified ? 'verified' : notification ? 'notification' : presence}
          aria-hidden="true"
        >
          {verified ? <Check size={9} /> : notification ? Math.min(notification, 99) : null}
        </span>
      )}
    </span>
  );
}

export function AvatarGroup({
  people,
  max = 3,
  size = 24,
}: {
  people: AvatarProps[];
  max?: number;
  size?: AvatarProps['size'];
}) {
  const visible = people.slice(0, Math.max(1, max));
  const hidden = people.slice(visible.length);
  return (
    <span className={s.avatarGroup} role="group" aria-label="Responsáveis">
      {visible.map((person) => (
        <Avatar key={person.name} {...person} size={size} />
      ))}
      {hidden.length > 0 && (
        <span
          className={s.avatarMore}
          style={{ width: size, height: size }}
          title={hidden.map((p) => p.name).join(', ')}
          aria-label={`Mais ${hidden.length}: ${hidden.map((p) => p.name).join(', ')}`}
        >
          +{hidden.length}
        </span>
      )}
    </span>
  );
}
