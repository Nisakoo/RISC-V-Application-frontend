// Адреса страниц совпадают с SSR-страницами backend
export const ROUTES = {
  FEED: '/riscv_commands/feed',
  ADD: '/riscv_commands/add',
  GRID: '/riscv_commands/grid',
  LOGIN: '/login',
}

export type RouteKeyType = keyof typeof ROUTES

export const ROUTE_LABELS: { [key in RouteKeyType]: string } = {
  FEED: 'Лента',
  ADD: 'Добавить',
  GRID: 'Плитка',
  LOGIN: 'Вход',
}

export const feedURL = (id: number): string => `${ROUTES.FEED}?id=${id}`
