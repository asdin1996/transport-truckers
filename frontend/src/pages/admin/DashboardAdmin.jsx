import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getViajes, cambiarEstado } from '../../services/viajes'
import { getCamioneros } from '../../services/camioneros'
import Pagination from '../../components/Pagination'
import NuevoViaje from './NuevoViaje'

const PER_PAGE = 15

const TIPO_LABELS = {
  carga:           'Carga',
  descarga:        'Descarga',
  adelantar_carga: 'Adelantar carga',
}

const ESTADOS_ACTIVOS = ['en_camino', 'llegada_destino', 'cargando', 'descargando']

const ESTADO_LABELS = {
  pendiente:       'Pendiente',
  en_camino:       'En camino',
  llegada_destino: 'En destino',
  cargando:        'Cargando',
  descargando:     'Descargando',
  finalizado:      'Finalizado',
  cancelado:       'Cancelado',
}

// Para cada camionero: viaje actual (activo > pendiente próximo) y próximo pendiente
function buildFilas(camioneros, viajes) {
  return camioneros.map((c) => {
    const suyos = viajes.filter((v) => v.camionero_id === c.id)

    const activo = suyos.find((v) => ESTADOS_ACTIVOS.includes(v.estado)) ?? null

    const pendientes = suyos
      .filter((v) => v.estado === 'pendiente')
      .sort((a, b) => {
        if (!a.fecha_inicio && !b.fecha_inicio) return 0
        if (!a.fecha_inicio) return 1
        if (!b.fecha_inicio) return -1
        return a.fecha_inicio.localeCompare(b.fecha_inicio)
      })

    const viajeActual  = activo ?? pendientes[0] ?? null
    const proximoViaje = activo ? (pendientes[0] ?? null) : (pendientes[1] ?? null)

    return { camionero: c, viajeActual, proximoViaje }
  })
}

function filtrarFilas(filas, q) {
  if (!q) return filas
  const ql = q.toLowerCase()
  return filas.filter(({ camionero: c, viajeActual: v }) =>
    `${c.nombre} ${c.apellidos}`.toLowerCase().includes(ql) ||
    (v?.origen  ?? '').toLowerCase().includes(ql) ||
    (v?.destino ?? '').toLowerCase().includes(ql) ||
    (v?.vehiculo?.matricula ?? '').toLowerCase().includes(ql)
  )
}

function fmtFecha(iso) {
  if (!iso) return null
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function DashboardAdmin() {
  const [viajes, setViajes]         = useState([])
  const [camioneros, setCamioneros] = useState([])
  const [loading, setLoading]       = useState(true)
  const [query, setQuery]           = useState('')
  const [page, setPage]             = useState(1)
  const [comenzando, setComenzando] = useState(null)
  const [modalCamioneroId, setModalCamioneroId] = useState(null)  // null = cerrado
  const [now, setNow] = useState(new Date())

  const cargar = () =>
    Promise.all([getViajes(), getCamioneros()])
      .then(([vRes, cRes]) => {
        setViajes(vRes.data.data      ?? [])
        setCamioneros(cRes.data.data  ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))

  useEffect(() => { cargar() }, [])

  // Actualizar fecha a medianoche si la app queda abierta
  useEffect(() => {
    const msHastaMedianoche = () => {
      const n = new Date()
      return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n
    }
    let timer
    const programar = () => { timer = setTimeout(() => { setNow(new Date()); programar() }, msHastaMedianoche()) }
    programar()
    return () => clearTimeout(timer)
  }, [])

  const handleComenzar = async (viajeId) => {
    setComenzando(viajeId)
    try {
      await cambiarEstado(viajeId, 'en_camino')
      await cargar()
    } catch { /* silencioso */ }
    finally { setComenzando(null) }
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>

  // Stats
  const activos    = viajes.filter((v) => ESTADOS_ACTIVOS.includes(v.estado))
  const pendientes = viajes.filter((v) => v.estado === 'pendiente')
  const finalizados = viajes.filter((v) => v.estado === 'finalizado')

  const enViaje = camioneros.filter((c) => activos.some((v) => v.camionero_id === c.id))
  const libres  = camioneros.filter((c) => !activos.some((v) => v.camionero_id === c.id))

  // Construir filas por camionero
  const todasFilas    = buildFilas(camioneros, viajes)
  const filasFiltradas = filtrarFilas(todasFilas, query)
  const filasPagina   = filasFiltradas.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const doSearch = (q) => { setQuery(q); setPage(1) }

  return (
    <div>
      {/* Cabecera */}
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>Panel de Administración</h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
            {now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => setModalCamioneroId('')}
          style={{ fontSize: 15, padding: '10px 24px', fontWeight: 600 }}
        >
          + Nuevo viaje
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ marginBottom: 20 }}>
        <StatCard label="Camioneros en viaje" value={enViaje.length}    color="var(--color-primary)" />
        <StatCard label="Camioneros libres"   value={libres.length}     color="#66bb6a" />
        <StatCard label="Viajes pendientes"   value={pendientes.length} color="#ffc107" to="/viajes?estado=pendiente" />
        <StatCard label="Finalizados hoy"     value={finalizados.filter((v) => v.fecha_fin === now.toISOString().slice(0,10)).length} color="#90a4ae" />
      </div>

      {/* Tabla camioneros */}
      <div className="card">
        <div className="table-controls">
          <p className="card__title" style={{ margin: 0 }}>Camioneros</p>
          <div className="table-search">
            <span className="table-search__icon">⌕</span>
            <input
              type="text"
              placeholder="Buscar camionero, origen, destino, matrícula…"
              value={query}
              onChange={(e) => doSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {filasFiltradas.length} de {camioneros.length}
          </span>
        </div>

        {camioneros.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Sin camioneros registrados.</p>
        ) : filasFiltradas.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Sin resultados.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Camionero</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Próximo viaje</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filasPagina.map(({ camionero: c, viajeActual: v, proximoViaje: prox }) => {
                  const libre = !v
                  const esActivo = v && ESTADOS_ACTIVOS.includes(v.estado)
                  const esPendiente = v && v.estado === 'pendiente'

                  return (
                    <tr key={c.id} style={{ opacity: libre ? 0.65 : 1 }}>

                      {/* Camionero */}
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {c.nombre} {c.apellidos}
                        </div>
                        {v?.vehiculo?.matricula && (
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 1 }}>
                            {v.vehiculo.matricula}
                            {v.vehiculo.marca ? ` · ${v.vehiculo.marca}` : ''}
                          </div>
                        )}
                      </td>

                      {/* Origen */}
                      <td style={{ fontSize: 13 }}>{v?.origen ?? <Dash />}</td>

                      {/* Destino */}
                      <td style={{ fontSize: 13 }}>{v?.destino ?? <Dash />}</td>

                      {/* Tipo */}
                      <td>{v?.tipo ? <TipoBadge tipo={v.tipo} /> : <Dash />}</td>

                      {/* Estado */}
                      <td>
                        {libre ? (
                          <span style={{
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                            padding: '2px 8px', borderRadius: 4,
                            background: 'rgba(102,187,106,0.12)', color: '#66bb6a',
                          }}>Libre</span>
                        ) : (
                          <span className={`badge badge--${v.estado}`}>
                            {ESTADO_LABELS[v.estado] ?? v.estado}
                          </span>
                        )}
                      </td>

                      {/* Próximo viaje */}
                      <td style={{ fontSize: 12, color: 'var(--color-text-muted)', minWidth: 180 }}>
                        {prox ? (
                          <div>
                            <span style={{ color: 'var(--color-primary)', marginRight: 4 }}>▶</span>
                            {[prox.origen, prox.destino].filter(Boolean).join(' → ') || `Viaje #${prox.id}`}
                            {prox.fecha_inicio && (
                              <span style={{ opacity: 0.7, marginLeft: 4 }}>· {fmtFecha(prox.fecha_inicio)}</span>
                            )}
                          </div>
                        ) : <Dash />}
                      </td>

                      {/* Acciones */}
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'nowrap' }}>
                          {esPendiente && (
                            <button
                              className="btn btn--primary btn--sm"
                              disabled={comenzando === v.id}
                              onClick={() => handleComenzar(v.id)}
                              style={{ fontSize: 12, padding: '4px 10px', whiteSpace: 'nowrap' }}
                            >
                              {comenzando === v.id ? '…' : '▶ Comenzar'}
                            </button>
                          )}
                          {v && (
                            <Link to={`/viajes/${v.id}`} className="btn btn--ghost btn--sm" style={{ whiteSpace: 'nowrap' }}>
                              Ver viaje
                            </Link>
                          )}
                          <button
                            className="btn btn--ghost btn--sm"
                            onClick={() => setModalCamioneroId(c.id)}
                            style={{ whiteSpace: 'nowrap', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                          >
                            + Nuevo viaje
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Pagination page={page} total={filasFiltradas.length} perPage={PER_PAGE} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Modal nuevo viaje */}
      {modalCamioneroId !== null && (
        <NuevoViaje
          defaultCamioneroId={modalCamioneroId}
          onClose={() => setModalCamioneroId(null)}
          onCreated={() => { setLoading(true); cargar() }}
        />
      )}
    </div>
  )
}

function Dash() {
  return <span style={{ color: 'var(--color-text-muted)', opacity: 0.4 }}>—</span>
}

function TipoBadge({ tipo }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
      padding: '2px 7px', borderRadius: 4,
      background: tipo === 'carga' ? 'rgba(33,150,243,0.12)' : tipo === 'adelantar_carga' ? 'rgba(76,175,80,0.12)' : 'rgba(255,152,0,0.12)',
      color:      tipo === 'carga' ? '#64b5f6'              : tipo === 'adelantar_carga' ? '#81c784'              : '#ffb74d',
    }}>
      {TIPO_LABELS[tipo] ?? tipo}
    </span>
  )
}

function StatCard({ label, value, color, to }) {
  const content = (
    <>
      <span className="stat-card__value" style={{ color }}>{value}</span>
      <span className="stat-card__label">{label}</span>
    </>
  )
  return to
    ? <Link to={to} className="stat-card stat-card--link">{content}</Link>
    : <div className="stat-card">{content}</div>
}
