import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useMensajes } from '../../context/MensajesContext'

const NAV_ADMIN = [
  {
    section: 'Inicio',
    links: [
      { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
    ],
  },
  {
    section: 'Configuración',
    links: [
      { to: '/configuracion/paradas', icon: '📍', label: 'Paradas' },
      { to: '/configuracion/mapon',   icon: '🛰',  label: 'Mapon GPS' },
    ],
  },
  {
    section: 'Gestión',
    links: [
      { to: '/camioneros', icon: '👤', label: 'Camioneros' },
      { to: '/vehiculos',  icon: '🚛', label: 'Vehículos' },
      { to: '/viajes',     icon: '🗺', label: 'Viajes' },
    ],
  },
  {
    section: 'Comunicación',
    links: [
      { to: '/mensajes', icon: '💬', label: 'Mensajes', badge: true },
    ],
  },
]

const NAV_CAMIONERO = [
  {
    section: 'Mi trabajo',
    links: [
      { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
      { to: '/viajes',    icon: '🗺', label: 'Mis Viajes' },
      { to: '/mensajes',  icon: '💬', label: 'Mensajes', badge: true },
    ],
  },
]

const NAV_MAPS = [
  {
    section: 'Mapa',
    links: [
      { to: '/dashboard', icon: '⊞', label: 'Mapa GPS' },
    ],
  },
]

export default function Sidebar({ open, onClose, onExpand, onCollapse }) {
  const { user, logout, isAdmin, isMaps } = useAuth()
  const { total } = useMensajes()

  const nav = isAdmin() ? NAV_ADMIN : isMaps() ? NAV_MAPS : NAV_CAMIONERO
  const initials = user?.name?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <aside
      className={`sidebar${open ? ' open' : ''}`}
      onMouseEnter={onExpand}
      onMouseLeave={onCollapse}
    >
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">🚛</div>
        <span className="sidebar__logo-text">Transporte Cubicaje</span>
      </div>

      <nav className="sidebar__nav">
        {nav.map((section) => (
          <div key={section.section}>
            <p className="nav-section__title">{section.section}</p>
            {section.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                title={link.label}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={onClose}
              >
                <span className="nav-link__icon">
                  {link.icon}
                  {link.badge && total > 0 && (
                    <span className="nav-badge">{total > 99 ? '99+' : total}</span>
                  )}
                </span>
                <span className="nav-link__label">{link.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">{initials}</div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{user?.name}</div>
            <div className="sidebar__user-role">{user?.role}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
