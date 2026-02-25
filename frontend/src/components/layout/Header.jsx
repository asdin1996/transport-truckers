import { useLocation } from 'react-router-dom'

const TITLES = {
  '/dashboard':      'Dashboard',
  '/camioneros':     'Camioneros',
  '/vehiculos':      'Vehículos',
  '/viajes':         'Viajes',
  '/viajes/nuevo':   'Nuevo viaje',
  '/mensajes':       'Mensajes',
  '/mapa':           'Mapa GPS',
}

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation()
  const title = TITLES[pathname] ?? (pathname.startsWith('/viajes/') ? 'Detalle viaje' : 'Transporte Cubicaje')

  return (
    <header className="header">
      <button className="header__menu-btn" onClick={onMenuClick} aria-label="Menú">
        ☰
      </button>
      <span className="header__title">{title}</span>
    </header>
  )
}
