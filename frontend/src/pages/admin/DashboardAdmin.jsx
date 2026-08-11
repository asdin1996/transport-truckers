import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getViajes, cambiarEstado } from '../../services/viajes'
import { getCamioneros } from '../../services/camioneros'
import Pagination from '../../components/Pagination'
import NuevoViaje from './NuevoViaje'

const PER_PAGE = 20

const TIPO_LABELS = {
  carga:           'Carga',
  descarga:        'Descarga',
  adelantar_carga: 'Adelantar carga',
}

const ESTADOS_ACTIVOS   = ['en_camino', 'llegada_destino', 'cargando', 'descargando']
const ESTADOS_VISIBLES  = [...ESTADOS_ACTIVOS, 'pendiente']

const ESTADO_LABELS = {
  pendiente:       'Pendiente',
  en_camino:       'En camino',
  llegada_destino: 'En destino',
  cargando:        'Cargando',
  descargando:     'Descargando',
  finalizado:      'Finalizado',
  cancelado:       'Cancelado',
}

// Activos primero, luego pendientes por fecha
function sortViajes(lista) {
  const orden = { en_camino: 0, cargando: 0, descargando: 0, llegada_destino: 1, pendiente: 2 }
  return [...lista].sort((a, b) => {
    const oa = orden[a.estado] ?? 9
    const ob = orden[b.estado] ?? 9
    if (oa !== ob) return oa - ob
    if (!a.fecha_inicio && !b.fecha_inicio) return 0
    if (!a.fecha_inicio) return 1
    if (!b.fecha_inicio) return -1
    return a.fecha_inicio.localeCompare(b.fecha_inicio)
  })
}

// Un grupo por camionero con sus viajes activos/pendientes
function buildGrupos(camioneros, viajes) {
  return camioneros.map((c) => {
    const suyos = viajes.filter(
      (v) => v.camionero_id === c.id && ESTADOS_VISIBLES.includes(v.estado)
    )
    return { camionero: c, viajes: sortViajes(suyos) }
  })
}

function filtrarGrupos(grupos, q) {
  if (!q) return grupos
  const ql = q.toLowerCase()
  return grupos
    .map(({ camionero: c, viajes }) => {
      const nombreMatch = `${c.nombre} ${c.apellidos}`.toLowerCase().includes(ql)
      const viajesFiltrados = nombreMatch
        ? viajes
        : viajes.filter(
            (v) =>
              (v.origen  ?? '').toLowerCase().includes(ql) ||
              (v.destino ?? '').toLowerCase().includes(ql) ||
              (v.vehiculo?.matricula ?? '').toLowerCase().includes(ql)
          )
      if (!nombreMatch && viajesFiltrados.length === 0) return null
      return { camionero: c, viajes: viajesFiltrados }
    })
    .filter(Boolean)
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
  const [modalCamioneroId, setModalCamioneroId] = useState(null)
  const [now, setNow]               = useState(new Date())

  const cargar = () =>
    Promise.all([getViajes(), getCamioneros()])
      .then(([vRes, cRes]) => {
        setViajes(vRes.data.data     ?? [])
        setCamioneros(cRes.data.data ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))

  useEffect(() => { cargar() }, [])

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
  const hoy        = now.toISOString().slice(0, 10)
  const finHoy     = viajes.filter((v) => v.estado === 'finalizado' && v.fecha_fin === hoy)

  const enViaje = camioneros.filter((c) => activos.some((v) => v.camionero_id === c.id))
  const libres  = camioneros.filter((c) => !activos.some((v) => v.camionero_id === c.id))

  // Grupos por camionero
  const todosGrupos     = buildGrupos(camioneros, viajes)
  const gruposFiltrados = filtrarGrupos(todosGrupos, query)
  const gruposPagina    = gruposFiltrados.slice((page - 1) * PER_PAGE, page * PER_PAGE)

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
        <StatCard label="Viajes pendientes"   value={pendientes.length} color="#ffc107" />
        <StatCard label="Finalizados hoy"     value={finHoy.length}     color="#90a4ae" />
      </div>

      {/* Tabla */}
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
            {gruposFiltrados.length} de {camioneros.length} camioneros
          </span>
        </div>

        {camioneros.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Sin camioneros registrados.</p>
        ) : gruposFiltrados.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Sin resultados.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: 170 }}>Camionero</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Próximo viaje</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {gruposPagina.map(({ camionero: c, viajes: viajesDriver }) => {
                  // Próximo pendiente después del viaje activo (si hay activo)
                  const primerActivo   = viajesDriver.find((v) => ESTADOS_ACTIVOS.includes(v.estado))
                  const pendientesOrdenados = viajesDriver.filter((v) => v.estado === 'pendiente')
                  const proximoViaje   = primerActivo ? (pendientesOrdenados[0] ?? null) : (pendientesOrdenados[1] ?? null)

                  // Camionero sin viajes → fila libre
                  if (viajesDriver.length === 0) {
                    return (
                      <tr key={`libre-${c.id}`} className="dashboard-group__first dashboard-group__last" style={{ opacity: 0.55 }}>
                        <td>
                          <CamioneroCell camionero={c} onNuevoViaje={() => setModalCamioneroId(c.id)} />
                        </td>
                        <td colSpan={5}>
                          <span className="badge-libre">Libre</span>
                        </td>
                        <td></td>
                        <td></td>
                      </tr>
                    )
                  }

                  return viajesDriver.map((v, idx) => {
                    const esPrimero   = idx === 0
                    const esUltimo    = idx === viajesDriver.length - 1
                    const esPendiente = v.estado === 'pendiente'
                    const esActivo    = ESTADOS_ACTIVOS.includes(v.estado)

                    // La columna "Próximo viaje" solo aparece en la primera fila del grupo
                    // y hace rowspan para no repetirla
                    const clases = [
                      esPrimero ? 'dashboard-group__first' : '',
                      esUltimo  ? 'dashboard-group__last'  : '',
                    ].filter(Boolean).join(' ')

                    return (
                      <tr key={v.id} className={clases}>
                        {/* Camionero — rowspan en toda la altura del grupo */}
                        {esPrimero && (
                          <td
                            rowSpan={viajesDriver.length}
                            style={{ verticalAlign: 'top', paddingTop: 10 }}
                          >
                            <CamioneroCell
                              camionero={c}
                              vehiculo={v.vehiculo}
                              onNuevoViaje={() => setModalCamioneroId(c.id)}
                            />
                          </td>
                        )}

                        {/* Origen */}
                        <td style={{ fontSize: 13 }}>{v.origen ?? <Dash />}</td>

                        {/* Destino */}
                        <td style={{ fontSize: 13 }}>{v.destino ?? <Dash />}</td>

                        {/* Tipo */}
                        <td>{v.tipo ? <TipoBadge tipo={v.tipo} /> : <Dash />}</td>

                        {/* Estado */}
                        <td>
                          <span className={`badge badge--${v.estado}`}>
                            {ESTADO_LABELS[v.estado] ?? v.estado}
                          </span>
                        </td>

                        {/* Fecha */}
                        <td style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                          {fmtFecha(v.fecha_inicio) ?? <Dash />}
                        </td>

                        {/* Próximo viaje — solo en la primera fila, con rowspan */}
                        {esPrimero && (
                          <td
                            rowSpan={viajesDriver.length}
                            style={{ fontSize: 12, color: 'var(--color-text-muted)', verticalAlign: 'middle', minWidth: 180 }}
                          >
                            {proximoViaje ? (
                              <div>
                                <span style={{ color: 'var(--color-primary)', marginRight: 4 }}>▶</span>
                                {[proximoViaje.origen, proximoViaje.destino].filter(Boolean).join(' → ') || `Viaje #${proximoViaje.id}`}
                                {proximoViaje.fecha_inicio && (
                                  <span style={{ opacity: 0.7, marginLeft: 4 }}>· {fmtFecha(proximoViaje.fecha_inicio)}</span>
                                )}
                              </div>
                            ) : <Dash />}
                          </td>
                        )}

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
                            <Link
                              to={`/viajes/${v.id}`}
                              className="btn btn--ghost btn--sm"
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              Ver viaje
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                })}
              </tbody>
            </table>
            <Pagination
              page={page}
              total={gruposFiltrados.length}
              perPage={PER_PAGE}
              onChange={setPage}
            />
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

function CamioneroCell({ camionero: c, vehiculo, onNuevoViaje }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>
        {c.nombre} {c.apellidos}
      </div>
      {vehiculo?.matricula && (
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          {vehiculo.matricula}{vehiculo.marca ? ` · ${vehiculo.marca}` : ''}
        </div>
      )}
      <button
        className="btn btn--ghost btn--sm"
        onClick={onNuevoViaje}
        style={{
          fontSize: 11, padding: '2px 8px',
          color: 'var(--color-primary)', borderColor: 'var(--color-primary)',
          marginTop: 4, alignSelf: 'flex-start',
        }}
      >
        + Nuevo viaje
      </button>
    </div>
  )
}

function Dash() {
  return <span style={{ color: 'var(--color-text-muted)', opacity: 0.4 }}>—</span>
}

function TipoBadge({ tipo }) {
  const colors = {
    carga:           { bg: 'rgba(33,150,243,0.12)', fg: '#64b5f6' },
    descarga:        { bg: 'rgba(255,152,0,0.12)',  fg: '#ffb74d' },
    adelantar_carga: { bg: 'rgba(76,175,80,0.12)',  fg: '#81c784' },
  }
  const { bg, fg } = colors[tipo] ?? { bg: 'rgba(150,150,150,0.12)', fg: '#aaa' }
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
      padding: '2px 7px', borderRadius: 4, background: bg, color: fg,
    }}>
      {TIPO_LABELS[tipo] ?? tipo}
    </span>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <span className="stat-card__value" style={{ color }}>{value}</span>
      <span className="stat-card__label">{label}</span>
    </div>
  )
}
