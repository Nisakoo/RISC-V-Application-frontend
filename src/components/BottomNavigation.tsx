import { FC, ReactNode } from 'react'
import { Nav } from 'react-bootstrap'
import { NavLink, useNavigate } from 'react-router-dom'

import { signOut } from '../api/auth'
import { useAppDispatch, useAppSelector } from '../hooks/store'
import { clearAccessToken } from '../modules/authStorage'
import { resetDraft } from '../slices/draftSlice'
import { resetFilters } from '../slices/riscvCommandsSlice'
import { clearUser, setAuthPending } from '../slices/userSlice'
import { ROUTES, ROUTE_LABELS, RouteKeyType } from '../Routes'

interface NavigationItem {
  route: RouteKeyType
  icon: ReactNode
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    route: 'FEED',
    icon: <path d="M5 6h14M5 12h14M5 18h14" />,
  },
  {
    route: 'ADD',
    icon: <path d="M12 5v14M5 12h14" />,
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
]

export const BottomNavigation: FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, pending: isLoggingOut } = useAppSelector((state) => state.user)

  const handleLogout = async () => {
    dispatch(setAuthPending(true))
    try {
      // Деавторизация выполняется только через axios, без thunk и кодогенерации
      await signOut()
    } catch {
      // Даже если сервер недоступен, локальную сессию нужно завершить
    } finally {
      clearAccessToken()
      dispatch(clearUser())
      dispatch(resetFilters())
      dispatch(resetDraft())
      dispatch(setAuthPending(false))
      navigate(ROUTES.FEED, { replace: true })
    }
  }

  const loginIcon = (
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l4-4-4-4M14 12H4" />
  )

  return (
    <Nav as="nav" className="bottom-navigation" aria-label="Основная навигация">
      <div className="bottom-navigation__container">
        {NAVIGATION_ITEMS.map(({ route, icon }) => (
          <Nav.Link
            key={route}
            as={NavLink}
            to={ROUTES[route]}
            className="bottom-navigation__link"
          >
            <svg className="bottom-navigation__icon" viewBox="0 0 24 24" aria-hidden="true">
              {icon}
            </svg>
            <span>{ROUTE_LABELS[route]}</span>
          </Nav.Link>
        ))}

        {isAuthenticated ? (
          <Nav.Link
            as="button"
            type="button"
            className="bottom-navigation__link"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="Выйти из аккаунта"
          >
            <svg className="bottom-navigation__icon" viewBox="0 0 24 24" aria-hidden="true">
              {loginIcon}
            </svg>
            <span>{isLoggingOut ? 'Выходим…' : 'Выход'}</span>
          </Nav.Link>
        ) : (
          <Nav.Link
            as={NavLink}
            to={ROUTES.LOGIN}
            className="bottom-navigation__link"
          >
            <svg className="bottom-navigation__icon" viewBox="0 0 24 24" aria-hidden="true">
              {loginIcon}
            </svg>
            <span>{ROUTE_LABELS.LOGIN}</span>
          </Nav.Link>
        )}
      </div>
    </Nav>
  )
}
