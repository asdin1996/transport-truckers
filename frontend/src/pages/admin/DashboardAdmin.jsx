import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getViajes, updateViaje, cambiarEstado, deleteViaje } from '../../services/viajes'
import { getCamioneros } from '../../services/camioneros'
import Pagination from '../../components/Pagination'
import ProximoViajeSelect from '../../components/ProximoViajeSelect'
import NuevoViaje from './NuevoViaje'

const PER_PAGE = 10

const ESTADO_LABELS_ACTIVO = {
  en_camino:       'En camino',
  llegada_destino: 'Llegada a destino',
  cargando:        'Cargando',
  descargando:     'Descargando',
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
  const [viajes, setViajes]               = useState([])
  const [camioneros, setCamioneros]       = useState([])
  const [loading, setLoading]             = useState(true)
  const [modalOpen, setModalOpen]         = useState(false)
  const [asignando, setAsignando]         = useState(null)
  const [asignandoCam, setAsignandoCam]   = useState(null)
  const [comenzando, setComenzando]       = useState(null)
  const [eliminando, setEliminando]       = useState(null)

  const [qActivos, setQActivos]       = useState('')
  const [pageActivos, setPageActivos] = useState(1)
  const [qPend, setQPend]             = useState('')
  const [pagePend, setPagePend]       = useState(1)
  const [now, setNow]                 = useState(new Date())

  const cargar = () =>
    getViajes()
      .then((res) => setViajes(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))

  useEffect(() => {
    cargar()
    getCamioneros().then((res) => setCamioneros(res.data.data ?? [])).catch(() => {})
  }, [])

  // Actualizar fecha automáticamente a medianoche (app puede quedar abierta todo el día)
  useEffect(() => {
    const msHastaMedianoche = () => {
      const n = new Date()
      return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n
    }
    let timer
    const programar = () => {
      timer = setTimeout(() => { setNow(new Date()); programar() }, msHastaMedianoche())
    }
    programar()
    return () => clearTimeout(timer)
  }, [])

  const handleAsignarProximo = async (activoViaje, pendienteId) => {
    setAsignando(activoViaje.id)
    try {
      if (pendienteId) {
        await updateViaje(pendienteId, { camionero_id: activoViaje.camionero_id })
      }
      await cargar()
    } catch {
      /* silencioso */
    } finally {
      setAsignando(null)
    }
  }

  const handleEliminarPendiente = async (viaje) => {
    setEliminando(viaje.id)
    try {
      await deleteViaje(viaje.id)
      await cargar()
    } catch {
      /* silencioso */
    } finally {
      setEliminando(null)
    }
  }

  const handleComenzarViaje = async (viaje) => {
    setComenzando(viaje.id)
    try {
      await cambiarEstado(viaje.id, 'en_camino')
      await cargar()
    } catch {
      /* silencioso */
    } finally {
      setComenzando(null)
    }
  }

  const handleAsignarCamionero = async (pendienteViaje, camioneroId) => {
    setAsignandoCam(pendienteViaje.id)
    try {
      await updateViaje(pendienteViaje.id, { camionero_id: camioneroId })
      await cargar()
    } catch {
      /* silencioso */
    } finally {
      setAsignandoCam(null)
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>

  const activos     = viajes.filter((v) => ['en_camino', 'llegada_destino', 'cargando', 'descargando'].includes(v.estado))
  const pendientes  = viajes.filter((v) => v.estado === 'pendiente')
  const finalizados = viajes.filter((v) => v.estado === 'finalizado')
  const sinAsignar  = pendientes.filter((v) => !v.camionero_id)


  const opcionesCamionero = camioneros.map((c) => ({
    value: c.id,
    label: `${c.nombre} ${c.apellidos}`,
  }))

  // Opciones para el selector de próximo viaje: todos los pendientes
  const opcionesProximo = pendientes.map((v) => ({
    value: v.id,
    label: [v.origen, v.destino].filter(Boolean).join(' → ') || `Viaje #${v.id}`,
    fecha: v.fecha_inicio
      ? new Date(v.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES')
      : null,
  }))

  const semanaInicio = (() => {
    const d = new Date(now); const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff); return d
  })()
  const semanaFin = new Date(semanaInicio); semanaFin.setDate(semanaInicio.getDate() + 6)
  const fmtSemana = (d) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

  const pendientesOrdenados = [...pendientes].sort((a, b) => {
    // Primero por fecha de salida (más próxima primero, sin fecha al final)
    if (a.fecha_inicio || b.fecha_inicio) {
      if (!a.fecha_inicio) return 1
      if (!b.fecha_inicio) return -1
      const diff = a.fecha_inicio.localeCompare(b.fecha_inicio)
      if (diff !== 0) return diff
    }
    // En caso de empate, por fecha de creación (más antiguo primero)
    if (!a.created_at && !b.created_at) return 0
    if (!a.created_at) return 1
    if (!b.created_at) return -1
    return a.created_at.localeCompare(b.created_at)
  })

  const activosFiltrados = filtrar(activos, qActivos)
  const pendFiltrados    = filtrar(pendientesOrdenados, qPend)
  const activosPage      = activosFiltrados.slice((pageActivos - 1) * PER_PAGE, pageActivos * PER_PAGE)
  const pendPage         = pendFiltrados.slice((pagePend - 1) * PER_PAGE, pagePend * PER_PAGE)

  return (
    <div>
      <div className="page-header">
        <h2>Panel de Administración</h2>
        <button
          className="btn btn--primary"
          onClick={() => setModalOpen(true)}
          style={{ fontSize: 15, padding: '10px 24px', fontWeight: 600 }}
        >
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
          <div style={{ marginLeft: 'auto', textAlign: 'right', lineHeight: 1.3 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
              {now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {now.getFullYear()}
            </div>
          </div>
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
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Próximo viaje</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {activosPage.map((v) => {
                  // Viajes pendientes ya asignados a este camionero
                  // eslint-disable-next-line eqeqeq
                  const pendientesDelCamionero = pendientes.filter((p) => p.camionero_id == v.camionero_id).reverse()
                  // Opciones: solo los pendientes SIN camionero asignado (para no duplicar)
                  const opcionesDisponibles = opcionesProximo.filter(
                    // eslint-disable-next-line eqeqeq
                    (o) => !pendientes.find((p) => p.id == o.value && p.camionero_id)
                  )

                  return (
                    <tr key={v.id}>
                      <td>
                        {v.camionero?.nombre} {v.camionero?.apellidos}
                        {v.vehiculo?.matricula && (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}> · {v.vehiculo.matricula}</span>
                        )}
                      </td>
                      <td>{v.origen ?? '—'}</td>
                      <td>{v.destino ?? '—'}</td>
                      <td><TipoBadge tipo={v.tipo} /></td>
                      <td>
                        <span className={`badge badge--${v.estado}`}>
                          {ESTADO_LABELS_ACTIVO[v.estado]}
                        </span>
                      </td>
                      <td style={{ minWidth: 220 }}>
                        {pendientesDelCamionero.length > 0 && (
                          <div style={{ marginBottom: 4 }}>
                            {pendientesDelCamionero.map((p) => (
                              <div key={p.id} style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                                <span style={{ color: 'var(--color-primary)', fontSize: 10 }}>▶</span>
                                {[p.origen, p.destino].filter(Boolean).join(' → ') || `Viaje #${p.id}`}
                                {p.fecha_inicio && (
                                  <span style={{ opacity: 0.7 }}>
                                    · {new Date(p.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES')}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <ProximoViajeSelect
                          value={null}
                          options={opcionesDisponibles}
                          disabled={asignando === v.id}
                          onChange={(val) => handleAsignarProximo(v, val)}
                          placeholder="+ Asignar viaje pendiente"
                        />
                      </td>
                      <td>
                        <Link to={`/viajes/${v.id}`} className="btn btn--ghost btn--sm">Ver</Link>
                      </td>
                    </tr>
                  )
                })}
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
          <div style={{ marginLeft: 'auto', textAlign: 'right', lineHeight: 1.3 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
              {fmtSemana(semanaInicio)} – {fmtSemana(semanaFin)} {semanaFin.getFullYear()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Semana actual
            </div>
          </div>
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
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Tipo</th>
                  <th>Fecha inicio</th>
                  <th>Camionero</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pendPage.map((v) => {
                  return (
                    <tr key={v.id}>
                      <td>{v.origen ?? '—'}</td>
                      <td>{v.destino ?? '—'}</td>
                      <td><TipoBadge tipo={v.tipo} /></td>
                      <td>
                        {v.fecha_inicio
                          ? new Date(v.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES')
                          : '—'}
                      </td>
                      <td style={{ minWidth: 220 }}>
                        <ProximoViajeSelect
                          value={v.camionero_id ?? null}
                          options={opcionesCamionero}
                          disabled={asignandoCam === v.id}
                          onChange={(val) => handleAsignarCamionero(v, val)}
                          placeholder="— Sin camionero —"
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          {v.camionero_id && (
                            <button
                              title="Comenzar viaje"
                              className="btn btn--primary btn--sm"
                              disabled={comenzando === v.id}
                              onClick={() => handleComenzarViaje(v)}
                              style={{ fontSize: 13, padding: '4px 10px' }}
                            >
                              {comenzando === v.id ? '…' : '▶ Comenzar'}
                            </button>
                          )}
                          <Link to={`/viajes/${v.id}`} className="btn btn--ghost btn--sm">Editar</Link>
                          <button
                            title="Eliminar viaje"
                            className="btn btn--ghost btn--sm"
                            disabled={eliminando === v.id}
                            onClick={() => handleEliminarPendiente(v)}
                            style={{ color: '#e57373', padding: '4px 8px', fontSize: 17 }}
                          >
                            {eliminando === v.id ? '…' : '🗑'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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

function TipoBadge({ tipo }) {
  if (!tipo) return <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>—</span>
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
      padding: '2px 7px', borderRadius: 4,
      background: tipo === 'carga' ? 'rgba(33,150,243,0.12)' : 'rgba(255,152,0,0.12)',
      color: tipo === 'carga' ? '#64b5f6' : '#ffb74d',
    }}>
      {tipo}
    </span>
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
