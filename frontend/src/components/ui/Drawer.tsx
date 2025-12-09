import type { PropsWithChildren } from 'react';

type DrawerProps = PropsWithChildren<{ open?: boolean }>;

const Drawer = ({ open, children }: DrawerProps) => {
  if (!open) return null;
  return <aside>{children}</aside>;
};

export default Drawer;
