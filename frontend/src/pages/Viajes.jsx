import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getViajes } from '../services/viajes'

const ESTADO_LABELS = {
  pendiente:  'Pendiente',
  en_curso:   'En curso',
  completado: 'Completado',
  cancelado:  'Cancelado',
}

export default function Viajes() {
  const [viajes, setViajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    getViajes()
      .then((res) => setViajes(res.data.data ?? []))
      .catch(() => setError('Error al cargar los viajes.'))
      .finally(() => setLoading(false))
  }, [])

  const lista = filtro === 'todos' ? viajes : viajes.filter((v) => v.estado === filtro)

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>
  if (error) return <div className="alert alert--error">{error}</div>

  return (
    <div>
      <div className="page-header">
        <h2>Mis Viajes</h2>
      </div>

      <div className="filter-tabs">
        {['todos', 'pendiente', 'en_curso', 'completado', 'cancelado'].map((e) => (
          <button
            key={e}
            className={`filter-tab${filtro === e ? ' active' : ''}`}
            onClick={() => setFiltro(e)}
          >
            {e === 'todos' ? 'Todos' : ESTADO_LABELS[e]}
          </button>
        ))}
      </div>

      <div className="card">
        {lista.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No hay viajes.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Ruta</th>
                  <th>Vehículo</th>
                  <th>Estado</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((v) => (
                  <tr key={v.id}>
                    <td>
                      {v.ruta?.origen ?? '—'} → {v.ruta?.destino ?? '—'}
                    </td>
                    <td>{v.vehiculo?.matricula ?? '—'}</td>
                    <td>
                      <span className={`badge badge--${v.estado}`}>
                        {ESTADO_LABELS[v.estado]}
                      </span>
                    </td>
                    <td>{v.fecha_inicio ? new Date(v.fecha_inicio).toLocaleDateString('es-ES') : '—'}</td>
                    <td>{v.fecha_fin ? new Date(v.fecha_fin).toLocaleDateString('es-ES') : '—'}</td>
                    <td>
                      <Link to={`/viajes/${v.id}`} className="btn btn--ghost btn--sm">
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
