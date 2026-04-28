import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getViajes, cambiarEstado } from '../../services/viajes'
import Pagination from '../../components/Pagination'
import NuevoViaje from './NuevoViaje'

const PER_PAGE = 10

const ESTADO_LABELS_ACTIVO = {
  en_camino:   'En camino',
  cargando:    'Cargando',
  descargando: 'Descargando',
}

function filtrar(lista, q) {
  if (!q) return lista
  const ql = q.toLowerCase()
  return lista.filter((v) =>
    `${v.camionero?.nombre ?? ''} ${v.camionero?.apellidos ?? ''}`.toLowerCase().includes(ql) ||
    (v.origen  ?? '').toLowerCase().includes(ql) ||
    (v.destino ?? '').toLowerCase().includes(ql) ||
    (v.vehiculo?.matricula ?? '').toLowerCase().includes(ql)
  )
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="table-search">
      <span className="table-search__icon">⌕</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

export default function DashboardAdmin() {
  const [viajes, setViajes]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const [qActivos, setQActivos]       = useState('')
  const [pageActivos, setPageActivos] = useState(1)

  const [qPend, setQPend]       = useState('')
  const [pagePend, setPagePend] = useState(1)

  const [comenzando, setComenzando] = useState(null)

  const cargar = () =>
    getViajes()
      .then((res) => setViajes(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))

  useEffect(() => { cargar() }, [])

  const handleComenzar = async (v) => {
    setComenzando(v.id)
    try {
      await cambiarEstado(v.id, 'en_camino')
      await cargar()
    } catch {
      /* silencioso — el backend responde con error si no autorizado */
    } finally {
      setComenzando(null)
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>

  const activos     = viajes.filter((v) => ['en_camino', 'cargando', 'descargando'].includes(v.estado))
  const pendientes  = viajes.filter((v) => v.estado === 'pendiente')
  const finalizados = viajes.filter((v) => v.estado === 'finalizado')

  const activosFiltrados  = filtrar(activos, qActivos)
  const pendFiltrados     = filtrar(pendientes, qPend)

  const activosPage = activosFiltrados.slice((pageActivos - 1) * PER_PAGE, pageActivos * PER_PAGE)
  const pendPage    = pendFiltrados.slice((pagePend - 1) * PER_PAGE, pagePend * PER_PAGE)

  return (
    <div>
      <div className="page-header">
        <h2>Panel de Administración</h2>
        <button className="btn btn--primary" onClick={() => setModalOpen(true)} style={{ fontSize: 15, padding: '10px 24px', fontWeight: 600 }}>
          + Nuevo viaje
        </button>
      </div>

      <div className="stats-row" style={{ marginBottom: 20 }}>
        <StatCard label="Viajes activos"    value={activos.length}    color="var(--color-primary)" to="/viajes?estado=en_camino" />
        <StatCard label="Viajes pendientes" value={pendientes.length} color="#ffc107"              to="/viajes?estado=pendiente" />
        <StatCard label="Finalizados"       value={finalizados.length} color="#66bb6a"             to="/viajes?estado=finalizado" />
      </div>

      {/* Viajes activos */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="table-controls">
          <p className="card__title" style={{ margin: 0 }}>Viajes activos</p>
          <SearchInput value={qActivos} onChange={(v) => { setQActivos(v); setPageActivos(1) }} placeholder="Buscar…" />
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {activosFiltrados.length} resultado{activosFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {activos.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No hay viajes activos.</p>
        ) : activosFiltrados.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Sin resultados.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Camionero / Vehículo</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {activosPage.map((v) => (
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
                      <span className={`badge badge--${v.estado}`}>
                        {ESTADO_LABELS_ACTIVO[v.estado]}
                      </span>
                    </td>
                    <td>
                      <Link to={`/viajes/${v.id}`} className="btn btn--ghost btn--sm">Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={pageActivos} total={activosFiltrados.length} perPage={PER_PAGE} onChange={setPageActivos} />
          </div>
        )}
      </div>

      {/* Viajes pendientes */}
      <div className="card">
        <div className="table-controls">
          <p className="card__title" style={{ margin: 0 }}>Viajes pendientes</p>
          <SearchInput value={qPend} onChange={(v) => { setQPend(v); setPagePend(1) }} placeholder="Buscar…" />
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {pendFiltrados.length} resultado{pendFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {pendientes.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Sin viajes pendientes.</p>
        ) : pendFiltrados.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Sin resultados.</p>
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
                {pendPage.map((v) => (
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
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn--primary btn--sm"
                          title="Comenzar viaje"
                          onClick={() => handleComenzar(v)}
                          disabled={comenzando === v.id}
                          style={{ minWidth: 32 }}
                        >
                          {comenzando === v.id ? '…' : '▶'}
                        </button>
                        <Link to={`/viajes/${v.id}`} className="btn btn--ghost btn--sm">Ver</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={pagePend} total={pendFiltrados.length} perPage={PER_PAGE} onChange={setPagePend} />
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
