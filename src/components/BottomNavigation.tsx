import { FC, ReactNode } from 'react'
import { Nav } from 'react-bootstrap'
import { NavLink } from 'react-router-dom'
import { ROUTES, ROUTE_LABELS, RouteKeyType } from '../Routes'

interface NavigationItem {
  route: RouteKeyType
  icon: ReactNode
  // Добавление и вход станут доступны вместе с авторизацией в следующих лабораторных
  disabled?: boolean
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    route: 'FEED',
    icon: <path d="M5 6h14M5 12h14M5 18h14" />,
  },
  {
    route: 'ADD',
    icon: <path d="M12 5v14M5 12h14" />,
    disabled: true,
  },
  {
    route: 'GRID',
    icon: (
      <g className="bottom-navigation__icon-fill">
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </g>
    ),
  },
  {
    route: 'LOGIN',
    icon: <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l4-4-4-4M14 12H4" />,
    disabled: true,
  },
]

export const BottomNavigation: FC = () => (
  <Nav as="nav" className="bottom-navigation" aria-label="Основная навигация">
    <div className="bottom-navigation__container">
      {NAVIGATION_ITEMS.map(({ route, icon, disabled }) => {
        const content = (
          <>
            <svg className="bottom-navigation__icon" viewBox="0 0 24 24" aria-hidden="true">
              {icon}
            </svg>
            <span>{ROUTE_LABELS[route]}</span>
          </>
        )
        return disabled ? (
          <Nav.Link key={route} className="bottom-navigation__link" disabled>
            {content}
          </Nav.Link>
        ) : (
          <Nav.Link key={route} as={NavLink} to={ROUTES[route]} className="bottom-navigation__link">
            {content}
          </Nav.Link>
        )
      })}
    </div>
  </Nav>
)
