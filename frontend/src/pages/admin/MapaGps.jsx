import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { getCamioneros } from '../../services/camioneros'
import { getUltimaPorCamionero } from '../../services/ubicaciones'

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function MapaGps() {
  const [marcadores, setMarcadores] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [actualizado, setActualizado] = useState(null)

  const cargar = async () => {
    try {
      const cRes = await getCamioneros()
      const camioneros = cRes.data.data ?? []

      const resultados = await Promise.allSettled(
        camioneros.map((c) =>
          getUltimaPorCamionero(c.id).then((r) => ({
            camionero: c,
            ubicacion: r.data.data,
          }))
        )
      )

      const conUbicacion = resultados
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value)
        .filter((r) => r.ubicacion)

      setMarcadores(conUbicacion)
      setActualizado(new Date())
    } catch {
      setError('Error al cargar las ubicaciones.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, 30000) // refresca cada 30s
    return () => clearInterval(interval)
  }, [])

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando mapa…</p>

  return (
    <div>
      <div className="page-header">
        <h2>Mapa GPS</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {actualizado && (
            <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
              Actualizado: {actualizado.toLocaleTimeString('es-ES')}
            </span>
          )}
          <button className="btn btn--ghost btn--sm" onClick={cargar}>
            ↻ Refrescar
          </button>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <MapContainer
          center={[40.416775, -3.703790]}
          zoom={6}
          style={{ height: '520px', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {marcadores.map(({ camionero, ubicacion }) => (
            <Marker
              key={camionero.id}
              position={[ubicacion.lat, ubicacion.lng]}
            >
              <Popup>
                <strong>{camionero.nombre} {camionero.apellidos}</strong>
                <br />
                {ubicacion.lat.toFixed(5)}, {ubicacion.lng.toFixed(5)}
                <br />
                <small>
                  {new Date(ubicacion.registrado_at).toLocaleString('es-ES')}
                </small>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {marcadores.length === 0 && !error && (
        <p style={{ color: 'var(--color-text-muted)', marginTop: 12, fontSize: 13 }}>
          No hay ubicaciones registradas aún.
        </p>
      )}
    </div>
  )
}
