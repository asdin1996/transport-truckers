import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getViajes } from '../services/viajes'
import { getGastos } from '../services/gastos'

const ESTADOS_ACTIVOS = ['en_camino', 'llegada_destino', 'cargando', 'descargando']

const ESTADO_LABELS = {
  pendiente:       'Pendiente',
  en_camino:       'En camino',
  llegada_destino: 'Llegada a destino',
  cargando:        'Cargando',
  descargando:     'Descargando',
  finalizado:      'Finalizado',
  cancelado:       'Cancelado',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [viajes, setViajes] = useState([])
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getViajes()])
      .then(([vRes]) => {
        const todos = vRes.data.data ?? []
        setViajes(todos)

        const activos = todos.filter((v) => ESTADOS_ACTIVOS.includes(v.estado))
        if (activos.length > 0) {
          return Promise.all(activos.map((v) => getGastos(v.id)))
        }
        return []
      })
      .then((results) => {
        const todos = results.flatMap((r) => r?.data?.data ?? [])
        setGastos(todos.slice(0, 5))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const activos    = viajes.filter((v) => ESTADOS_ACTIVOS.includes(v.estado))
  const pendientes = viajes.filter((v) => v.estado === 'pendiente')

  if (loading) {
    return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>
  }

  return (
    <div>
      <div className="page-header">
        <h2>Bienvenido, {user?.name}</h2>
      </div>

      <div className="dashboard-grid">
        {/* Estadísticas */}
        <div className="stats-row">
          <StatCard label="Viajes en curso"   value={activos.length}    color="var(--color-primary)" to="/viajes?estado=en_camino" />
          <StatCard label="Viajes pendientes" value={pendientes.length}  color="#ffc107"              to="/viajes?estado=pendiente" />
          <StatCard label="Total viajes"      value={viajes.length}      color="#42a5f5"              to="/viajes" />
        </div>

        {/* Viajes activos */}
        <div className="card" style={{ marginTop: 20 }}>
          <p className="card__title">Viajes en curso</p>
          {activos.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No hay viajes activos.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Ruta</th>
                    <th>Estado</th>
                    <th>Vehículo</th>
                    <th>Inicio</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {activos.map((v) => (
                    <tr key={v.id}>
                      <td>{v.origen ?? '—'} → {v.destino ?? '—'}</td>
                      <td>
                        <span className={`badge badge--${v.estado}`}>
                          {ESTADO_LABELS[v.estado] ?? v.estado}
                        </span>
                      </td>
                      <td>{v.vehiculo?.matricula ?? '—'}</td>
                      <td>{v.fecha_inicio ? new Date(v.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES') : '—'}</td>
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

        {/* Viajes pendientes */}
        <div className="card" style={{ marginTop: 20 }}>
          <p className="card__title">Próximos viajes</p>
          {pendientes.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No hay viajes pendientes.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Ruta</th>
                    <th>Vehículo</th>
                    <th>Fecha prevista</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pendientes.map((v) => (
                    <tr key={v.id}>
                      <td>{v.origen ?? '—'} → {v.destino ?? '—'}</td>
                      <td>{v.vehiculo?.matricula ?? '—'}</td>
                      <td>{v.fecha_inicio ? new Date(v.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES') : '—'}</td>
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

        {/* Últimos gastos */}
        <div className="card" style={{ marginTop: 20 }}>
          <p className="card__title">Últimos gastos</p>
          {gastos.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Sin gastos registrados.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Importe</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {gastos.map((g) => (
                    <tr key={g.id}>
                      <td style={{ textTransform: 'capitalize' }}>{g.tipo}</td>
                      <td>{parseFloat(g.importe).toFixed(2)} €</td>
                      <td>{g.fecha ? new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-ES') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, to }) {
  return (
    <Link to={to} className="stat-card stat-card--link">
      <span className="stat-card__value" style={{ color }}>
        {value}
      </span>
      <span className="stat-card__label">{label}</span>
    </Link>
  )
}
