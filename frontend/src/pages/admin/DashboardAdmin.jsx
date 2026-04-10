import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getViajes } from '../../services/viajes'
import NuevoViaje from './NuevoViaje'

function startOfWeek() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const lunes = new Date(d.setDate(diff))
  lunes.setHours(0, 0, 0, 0)
  return lunes
}

function endOfWeek() {
  const lunes = startOfWeek()
  const domingo = new Date(lunes)
  domingo.setDate(lunes.getDate() + 6)
  domingo.setHours(23, 59, 59, 999)
  return domingo
}

export default function DashboardAdmin() {
  const [viajes, setViajes]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [modalOpen, setModalOpen]   = useState(false)

  const cargar = () =>
    getViajes()
      .then((res) => setViajes(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))

  useEffect(() => { cargar() }, [])

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>

  const enCurso     = viajes.filter((v) => v.estado === 'en_curso')
  const completados = viajes.filter((v) => v.estado === 'completado')

  const inicio  = startOfWeek()
  const fin     = endOfWeek()
  const pendientesSemana = viajes.filter((v) => {
    if (v.estado !== 'pendiente') return false
    if (!v.fecha_inicio) return true
    const f = new Date(v.fecha_inicio + 'T00:00:00')
    return f >= inicio && f <= fin
  })

  return (
    <div>
      <div className="page-header">
        <h2>Panel de Administración</h2>
        <button className="btn btn--primary btn--sm" onClick={() => setModalOpen(true)}>
          + Nuevo viaje
        </button>
      </div>

      <div className="stats-row" style={{ marginBottom: 20 }}>
        <StatCard label="Viajes en curso"    value={enCurso.length}      color="var(--color-primary)" to="/viajes?estado=en_curso" />
        <StatCard label="Viajes pendientes"  value={pendientesSemana.length} color="#ffc107"           to="/viajes?estado=pendiente" />
        <StatCard label="Completados"        value={completados.length}   color="#66bb6a"              to="/viajes?estado=completado" />
      </div>

      {/* Viajes en curso */}
      <div className="card" style={{ marginBottom: 20 }}>
        <p className="card__title">Viajes en curso</p>
        {enCurso.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No hay viajes activos.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Camionero / Vehículo</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {enCurso.map((v) => (
                  <tr key={v.id}>
                    <td>
                      {v.camionero?.nombre} {v.camionero?.apellidos}
                      {v.vehiculo?.matricula && (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}> · {v.vehiculo.matricula}</span>
                      )}
                    </td>
                    <td>{v.origen ?? '—'}</td>
                    <td>{v.destino ?? '—'}</td>
                    <td>
                      <Link to={`/viajes/${v.id}`} className="btn btn--ghost btn--sm">Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Viajes pendientes esta semana */}
      <div className="card">
        <p className="card__title">Viajes pendientes — semana actual</p>
        {pendientesSemana.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Sin viajes pendientes esta semana.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Camionero / Vehículo</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Fecha inicio</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pendientesSemana.map((v) => (
                  <tr key={v.id}>
                    <td>
                      {v.camionero?.nombre} {v.camionero?.apellidos}
                      {v.vehiculo?.matricula && (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}> · {v.vehiculo.matricula}</span>
                      )}
                    </td>
                    <td>{v.origen ?? '—'}</td>
                    <td>{v.destino ?? '—'}</td>
                    <td>
                      {v.fecha_inicio
                        ? new Date(v.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES')
                        : '—'}
                    </td>
                    <td>
                      <Link to={`/viajes/${v.id}`} className="btn btn--ghost btn--sm">Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <NuevoViaje
          onClose={() => setModalOpen(false)}
          onCreated={() => { setLoading(true); cargar() }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, color, to }) {
  return (
    <Link to={to} className="stat-card stat-card--link">
      <span className="stat-card__value" style={{ color }}>{value}</span>
      <span className="stat-card__label">{label}</span>
    </Link>
  )
}
