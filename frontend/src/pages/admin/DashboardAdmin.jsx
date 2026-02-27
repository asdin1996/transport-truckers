import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getVehiculos } from '../../services/vehiculos'
import { getViajes } from '../../services/viajes'
import { getCamioneros } from '../../services/camioneros'

export default function DashboardAdmin() {
  const [stats, setStats] = useState({ viajes: [], vehiculos: [], camioneros: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getViajes(), getVehiculos(), getCamioneros()])
      .then(([vRes, veRes, cRes]) => {
        setStats({
          viajes:     vRes.data.data ?? [],
          vehiculos:  veRes.data.data ?? [],
          camioneros: cRes.data.data ?? [],
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>

  const enCurso    = stats.viajes.filter((v) => v.estado === 'en_curso')
  const pendientes = stats.viajes.filter((v) => v.estado === 'pendiente')

  return (
    <div>
      <div className="page-header">
        <h2>Panel de Administración</h2>
        <Link to="/viajes/nuevo" className="btn btn--primary btn--sm">
          + Nuevo viaje
        </Link>
      </div>

      <div className="stats-row" style={{ marginBottom: 20 }}>
        <StatCard label="Viajes en curso"    value={enCurso.length}          color="var(--color-primary)" to="/viajes?estado=en_curso" />
        <StatCard label="Viajes pendientes"  value={pendientes.length}        color="#ffc107"              to="/viajes?estado=pendiente" />
        <StatCard label="Vehículos"          value={stats.vehiculos.length}   color="#42a5f5"              to="/vehiculos" />
        <StatCard label="Camioneros"         value={stats.camioneros.length}  color="#66bb6a"              to="/camioneros" />
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
                  <th>Camionero</th>
                  <th>Ruta</th>
                  <th>Vehículo</th>
                  <th>Inicio</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {enCurso.map((v) => (
                  <tr key={v.id}>
                    <td>{v.camionero?.nombre} {v.camionero?.apellidos}</td>
                    <td>{v.ruta?.origen} → {v.ruta?.destino}</td>
                    <td>{v.vehiculo?.matricula}</td>
                    <td>{v.fecha_inicio ? new Date(v.fecha_inicio).toLocaleDateString('es-ES') : '—'}</td>
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

      {/* Flota */}
      <div className="card">
        <div className="page-header" style={{ marginBottom: 12 }}>
          <p className="card__title" style={{ margin: 0 }}>Flota de vehículos</p>
          <Link to="/vehiculos" className="btn btn--ghost btn--sm">Gestionar</Link>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Marca / Modelo</th>
                <th>Año</th>
              </tr>
            </thead>
            <tbody>
              {stats.vehiculos.slice(0, 5).map((v) => (
                <tr key={v.id}>
                  <td>{v.matricula}</td>
                  <td>{v.marca} {v.modelo}</td>
                  <td>{v.anio}</td>
                </tr>
              ))}
              {stats.vehiculos.length === 0 && (
                <tr><td colSpan={3} style={{ color: 'var(--color-text-muted)' }}>Sin vehículos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
