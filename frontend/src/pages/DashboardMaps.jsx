import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getMaponUnits, getMaponDashboard } from '../services/mapon'

const makeIcon = (color) => L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.625 14 22 14 22S28 23.625 28 14C28 6.268 21.732 0 14 0z"
      fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="14" cy="14" r="5" fill="#fff"/>
  </svg>`,
  iconSize:   [28, 36],
  iconAnchor: [14, 36],
  popupAnchor:[0, -36],
})

const ICON_MOVING  = makeIcon('#22c55e')
const ICON_STOPPED = makeIcon('#ef4444')

const makeIconTienda = (color) => L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="15" fill="${color}" stroke="#fff" stroke-width="2"/>
    <text x="16" y="21" text-anchor="middle" font-size="16">🏪</text>
  </svg>`,
  iconSize:   [32, 32],
  iconAnchor: [16, 16],
  popupAnchor:[0, -18],
})

const INTERVALO    = 30000
const DISTANCIA_KM = 5

const ESTADOS_CONFIG = {
  en_camino:       { label: 'En camino',       color: '#3b82f6', bg: '#1e3a5f' },
  llegada_destino: { label: 'En destino',       color: '#f59e0b', bg: '#3d2e0a' },
  cargando:        { label: 'Cargando',         color: '#a78bfa', bg: '#2e1f4f' },
  descargando:     { label: 'Descargando',      color: '#fb923c', bg: '#3d1f0a' },
}

function proyectarPunto(lat, lng, bearing, distKm) {
  const R    = 6371
  const d    = distKm / R
  const brng = (bearing * Math.PI) / 180
  const lat1 = (lat * Math.PI) / 180
  const lng1 = (lng * Math.PI) / 180
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  )
  const lng2 = lng1 + Math.atan2(
    Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  )
  return [(lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI]
}

function DeselectOnMapClick({ onDeselect }) {
  useMapEvents({ click: onDeselect })
  return null
}

const CENTRO_ESPANA = [40.416775, -3.703790]
const BOUNDS_ESPANA = L.latLngBounds([35.9, -9.3], [43.8, 4.3])

function AjustarVista({ unidades }) {
  const map      = useMap()
  const ajustado = useRef(false)

  useEffect(() => {
    if (ajustado.current) return
    if (unidades.length === 0) {
      map.fitBounds(BOUNDS_ESPANA, { padding: [30, 30] })
    } else {
      const bounds = L.latLngBounds(unidades.map((u) => [u.lat, u.lng]))
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 12 })
    }
    ajustado.current = true
  }, [unidades, map])
  return null
}

function TarjetaViaje({ viaje, seleccionado, onSelect }) {
  const cfg = ESTADOS_CONFIG[viaje.estado] ?? { label: viaje.estado, color: '#888', bg: '#222' }
  const activo = seleccionado === viaje.viaje_id

  return (
    <div
      onClick={() => onSelect(activo ? null : viaje.viaje_id)}
      style={{
        background:    activo ? '#1e1e1e' : '#161616',
        border:        `1px solid ${activo ? cfg.color : '#2a2a2a'}`,
        borderRadius:  8,
        padding:       '12px 14px',
        cursor:        'pointer',
        transition:    'border-color .15s',
        marginBottom:  8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>
          {viaje.matricula ?? '—'}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
          color: cfg.color, background: cfg.bg,
        }}>
          {cfg.label}
        </span>
      </div>

      <div style={{ fontSize: 12, color: '#aaa', marginBottom: 2 }}>
        {viaje.camionero ?? 'Sin asignar'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#ccc', margin: '6px 0' }}>
        <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {viaje.origen}
        </span>
        <span style={{ color: '#555', flexShrink: 0 }}>→</span>
        <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {viaje.destino}
        </span>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginBottom: 4 }}>
          <span>Progreso</span>
          <span style={{ color: cfg.color }}>{viaje.progreso}%</span>
        </div>
        <div style={{ background: '#2a2a2a', borderRadius: 4, height: 5, overflow: 'hidden' }}>
          <div style={{
            width:      `${viaje.progreso}%`,
            height:     '100%',
            background: cfg.color,
            borderRadius: 4,
            transition: 'width .4s',
          }} />
        </div>
      </div>

      {viaje.gps && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#666' }}>
          {viaje.gps.speed > 0
            ? <span style={{ color: '#22c55e' }}>● {viaje.gps.speed} km/h</span>
            : <span style={{ color: '#ef4444' }}>● Detenido</span>
          }
        </div>
      )}
    </div>
  )
}

export default function DashboardMaps() {
  const [unidades, setUnidades]         = useState([])
  const [viajes, setViajes]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [actualizado, setActualizado]   = useState(null)
  const [seleccionado, setSeleccionado] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const [resUnits, resDash] = await Promise.all([
        getMaponUnits(),
        getMaponDashboard(),
      ])
      setUnidades(resUnits.data.data ?? [])
      setViajes(resDash.data.data ?? [])
      setActualizado(new Date())
      setError(null)
    } catch (err) {
      const msg = err?.response?.data?.message
      setError(msg ?? 'No se pudieron obtener los datos. Comprueba la API key en Configuración.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, INTERVALO)
    return () => clearInterval(interval)
  }, [cargar])

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#111', zIndex: 50 }}>
      <style>{`
        @keyframes route-flow { to { stroke-dashoffset: -17; } }
        .route-animated { animation: route-flow 0.7s linear infinite; }
      `}</style>

      {/* Barra superior */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', background: '#1a1a1a', borderBottom: '1px solid #2e2e2e', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>Mapa en tiempo real</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {error && <span style={{ color: '#ef4444', fontSize: 13 }}>{error}</span>}
          {actualizado && (
            <span style={{ color: '#888', fontSize: 12 }}>
              Actualizado: {actualizado.toLocaleTimeString('es-ES')}
            </span>
          )}
          <span style={{ fontSize: 12, color: '#888' }}>
            {unidades.length} {unidades.length === 1 ? 'vehículo' : 'vehículos'}
          </span>
          <button className="btn btn--ghost btn--sm" onClick={cargar}>Refrescar</button>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Mapa */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {loading ? (
            <p style={{ color: '#888', padding: 24 }}>Cargando mapa…</p>
          ) : (
            <MapContainer
              center={CENTRO_ESPANA}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <DeselectOnMapClick onDeselect={() => setSeleccionado(null)} />
              <AjustarVista unidades={unidades} />

              {(() => {
                const viajeMap = Object.fromEntries(
                  viajes.map((v) => [String(v.matricula ?? '').toUpperCase().trim(), v])
                )
                return unidades.map((u) => {
                  const enMovimiento = u.speed > 0
                  const viaje        = viajeMap[String(u.label ?? '').toUpperCase().trim()]
                  const destino      = viaje
                    ? (viaje.destino_lat && viaje.destino_lng
                        ? [viaje.destino_lat, viaje.destino_lng]
                        : proyectarPunto(u.lat, u.lng, u.direction, DISTANCIA_KM))
                    : null
                  const lineColor    = ESTADOS_CONFIG[viaje?.estado]?.color ?? '#3b82f6'

                  return (
                  <Marker
                    key={u.unit_id}
                    position={[u.lat, u.lng]}
                    icon={enMovimiento ? ICON_MOVING : ICON_STOPPED}
                    eventHandlers={{
                      click: (e) => {
                        L.DomEvent.stopPropagation(e)
                        setSeleccionado(seleccionado === u.unit_id ? null : u.unit_id)
                      },
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: 150 }}>
                        <strong style={{ fontSize: 14 }}>{u.label}</strong>
                        <br />
                        <span style={{ color: enMovimiento ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: 12 }}>
                          {enMovimiento ? `En movimiento · ${u.speed} km/h` : 'Detenido'}
                        </span>
                        <br />
                        {u.updated_at && (
                          <small style={{ color: '#999' }}>
                            {new Date(u.updated_at).toLocaleString('es-ES')}
                          </small>
                        )}
                      </div>
                    </Popup>

                    {destino && (
                      <Polyline
                        positions={[[u.lat, u.lng], destino]}
                        pathOptions={{ color: lineColor, weight: 2.5, dashArray: '10 7', className: 'route-animated' }}
                      />
                    )}
                    {destino && <Marker position={destino} icon={makeIconTienda(lineColor)} />}
                  </Marker>
                )
              })
              })()}
            </MapContainer>
          )}
        </div>

        {/* Panel lateral */}
        <div style={{
          width:      300,
          flexShrink: 0,
          background: '#111',
          borderLeft: '1px solid #2a2a2a',
          display:    'flex',
          flexDirection: 'column',
          overflow:   'hidden',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #2a2a2a', flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>
              Viajes activos
            </span>
            <span style={{ marginLeft: 8, fontSize: 12, color: '#555' }}>
              ({viajes.length})
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
            {viajes.length === 0 ? (
              <p style={{ color: '#555', fontSize: 13, textAlign: 'center', marginTop: 24 }}>
                No hay viajes activos
              </p>
            ) : (
              viajes.map((v) => (
                <TarjetaViaje
                  key={v.viaje_id}
                  viaje={v}
                  seleccionado={seleccionado}
                  onSelect={setSeleccionado}
                />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
