'use client';

import {
  createContext,
  useContext,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from 'react';

export type NavigationLinkProps = ComponentProps<'a'>;
const NavigationContext = createContext<ComponentType<NavigationLinkProps> | 'a'>('a');

/** O produto fornece seu roteador; o catálogo continua usando âncoras nativas. */
export function NavigationProvider({
  link,
  children,
}: {
  link: ComponentType<NavigationLinkProps>;
  children: ReactNode;
}) {
  return <NavigationContext.Provider value={link}>{children}</NavigationContext.Provider>;
}

export function NavigationLink(props: NavigationLinkProps) {
  const Link = useContext(NavigationContext);
  return <Link {...props} />;
}
