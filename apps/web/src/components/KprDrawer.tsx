// apps/web/src/components/KprDrawer.tsx
// Backward-compatible wrapper forwarding to the unified BookkeepingDrawer (Faza 17)

import { BookkeepingDrawer, type BookkeepingDrawerProps } from './bookkeeping/BookkeepingDrawer';

export type KprDrawerProps = BookkeepingDrawerProps;

export function KprDrawer(props: KprDrawerProps) {
  return <BookkeepingDrawer {...props} />;
}
