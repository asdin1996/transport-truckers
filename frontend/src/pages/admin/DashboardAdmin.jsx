import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getViajes, cambiarEstado, cambiarOrden } from '../../services/viajes'
import { getCamionerosAlmacen } from '../../services/camioneros'
import Pagination from '../../components/Pagination'
import NuevoViaje from './NuevoViaje'

const PER_PAGE = 20

const TIPO_LABELS = {
  carga:           'Carga',
  descarga:        'Descarga',
  adelantar_carga: 'Adelantar carga',
}

const ESTADOS_ACTIVOS  = ['en_camino', 'llegada_destino', 'cargando', 'descargando']
const ESTADOS_VISIBLES = [...ESTADOS_ACTIVOS, 'pendiente']

const ESTADO_LABELS = {
  pendiente:       'Pendiente',
  en_camino:       'En camino',
  llegada_destino: 'En destino',
  cargando:        'Cargando',
  descargando:     'Descargando',
  finalizado:      'Finalizado',
  cancelado:       'Cancelado',
}

function sortViajes(lista) {
  const peso = { en_camino: 0, cargando: 0, descargando: 0, llegada_destino: 1, pendiente: 2 }
  return [...lista].sort((a, b) => {
    const pa = peso[a.estado] ?? 9
    const pb = peso[b.estado] ?? 9
    if (pa !== pb) return pa - pb
    if (a.estado === 'pendiente' && b.estado === 'pendiente') {
      const oa = a.orden ?? Infinity
      const ob = b.orden ?? Infinity
      if (oa !== ob) return oa - ob
    }
    if (a.fecha_inicio && b.fecha_inicio && a.fecha_inicio !== b.fecha_inicio)
      return a.fecha_inicio.localeCompare(b.fecha_inicio)
    if (!a.fecha_inicio && b.fecha_inicio) return 1
    if (a.fecha_inicio && !b.fecha_inicio) return -1
    return a.id - b.id
  })
}

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
      const filtrados   = nombreMatch
        ? viajes
        : viajes.filter(
            (v) =>
              (v.origen  ?? '').toLowerCase().includes(ql) ||
              (v.destino ?? '').toLowerCase().includes(ql) ||
              (v.vehiculo?.matricula ?? '').toLowerCase().includes(ql)
          )
      if (!nombreMatch && filtrados.length === 0) return null
      return { camionero: c, viajes: filtrados }
    })
    .filter(Boolean)
}

function fmtFecha(iso) {
  if (!iso) return null
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

const COLS = 8 // número total de columnas

export default function DashboardAdmin() {
  const [viajes, setViajes]         = useState([])
  const [camioneros, setCamioneros] = useState([])
  const [loading, setLoading]       = useState(true)
  const [query, setQuery]           = useState('')
  const [page, setPage]             = useState(1)
  const [comenzando, setComenzando]     = useState(null)
  const [reordenando, setReordenando]   = useState(null)
  const [modalCamioneroId, setModalCamioneroId] = useState(null)
  const [now, setNow] = useState(new Date())

  const cargar = () =>
    Promise.all([getViajes(), getCamionerosAlmacen()])
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
    const prog = () => { timer = setTimeout(() => { setNow(new Date()); prog() }, msHastaMedianoche()) }
    prog()
    return () => clearTimeout(timer)
  }, [])

  const handleComenzar = async (viajeId) => {
    setComenzando(viajeId)
    try { await cambiarEstado(viajeId, 'en_camino'); await cargar() }
    catch { /* silencioso */ }
    finally { setComenzando(null) }
  }

  const handleMover = async (camioneroId, viajeId, dir) => {
    setReordenando(viajeId)
    try {
      const pendientes = viajes
        .filter((v) => v.camionero_id === camioneroId && v.estado === 'pendiente')
        .sort((a, b) => {
          const oa = a.orden ?? Infinity, ob = b.orden ?? Infinity
          if (oa !== ob) return oa - ob
          if (a.fecha_inicio && b.fecha_inicio && a.fecha_inicio !== b.fecha_inicio)
            return a.fecha_inicio.localeCompare(b.fecha_inicio)
          return a.id - b.id
        })

      const idx = pendientes.findIndex((v) => v.id === viajeId)
      if (idx === -1) return
      const swapIdx = dir === 'arriba' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= pendientes.length) return

      const reord = [...pendientes]
      ;[reord[idx], reord[swapIdx]] = [reord[swapIdx], reord[idx]]

      await Promise.all(reord.map((v, i) => cambiarOrden(v.id, i + 1)))

      setViajes((prev) =>
        prev.map((v) => {
          const pos = reord.findIndex((r) => r.id === v.id)
          return pos !== -1 ? { ...v, orden: pos + 1 } : v
        })
      )
    } catch { /* silencioso */ }
    finally { setReordenando(null) }
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>

  const activos    = viajes.filter((v) => ESTADOS_ACTIVOS.includes(v.estado))
  const pendientes = viajes.filter((v) => v.estado === 'pendiente')
  const hoy        = now.toISOString().slice(0, 10)
  const finHoy     = viajes.filter((v) => v.estado === 'finalizado' && v.fecha_fin === hoy)
  const enViaje    = camioneros.filter((c) => activos.some((v) => v.camionero_id === c.id))
  const libres     = camioneros.filter((c) => !activos.some((v) => v.camionero_id === c.id))

  const todosGrupos     = buildGrupos(camioneros, viajes)
  const gruposFiltrados = filtrarGrupos(todosGrupos, query)
  const gruposPagina    = gruposFiltrados.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const doSearch = (q) => { setQuery(q); setPage(1) }

  return (
    <div>
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

      <div className="stats-row" style={{ marginBottom: 20 }}>
        <StatCard label="Camioneros en viaje" value={enViaje.length}    color="var(--color-primary)" />
        <StatCard label="Camioneros libres"   value={libres.length}     color="#66bb6a" />
        <StatCard label="Viajes pendientes"   value={pendientes.length} color="#ffc107" />
        <StatCard label="Finalizados hoy"     value={finHoy.length}     color="#90a4ae" />
      </div>

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
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 170 }}>Camionero</th>
                  <th style={{ width: 36 }}></th>{/* flechas orden */}
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th style={{ width: 72 }}>Fecha</th>
                  <th style={{ minWidth: 200 }}>Próximo viaje</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {gruposPagina.map(({ camionero: c, viajes: vd }, gIdx) => {
                  const pendientesDriver = vd.filter((v) => v.estado === 'pendiente')
                  const primerActivo     = vd.find((v) => ESTADOS_ACTIVOS.includes(v.estado))
                  const proximoViaje     = primerActivo ? (pendientesDriver[0] ?? null) : (pendientesDriver[1] ?? null)
                  const esLibre          = vd.length === 0
                  const rowspan          = esLibre ? 1 : vd.length

                  // Contenido de la celda "Camionero" (rowspan)
                  const vehiculoActivo = vd[0]?.vehiculo ?? null

                  // Contenido de "Próximo viaje" (siempre en la primera fila)
                  const proxCell = proximoViaje ? (
                    <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                      <div style={{ color: 'var(--color-primary)', fontWeight: 600, marginBottom: 1 }}>▶ Próximo</div>
                      <div style={{ color: 'var(--color-text)' }}>
                        {[proximoViaje.origen, proximoViaje.destino].filter(Boolean).join(' → ') || `Viaje #${proximoViaje.id}`}
                      </div>
                      {proximoViaje.fecha_inicio && (
                        <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginTop: 1 }}>
                          {fmtFecha(proximoViaje.fecha_inicio)}
                        </div>
                      )}
                    </div>
                  ) : null

                  const camioneroCell = (
                    <td
                      rowSpan={rowspan}
                      className="dashboard-driver-cell"
                    >
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>
                        {c.nombre} {c.apellidos}
                      </div>
                      {vehiculoActivo?.matricula && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                          {vehiculoActivo.matricula}
                          {vehiculoActivo.marca ? ` · ${vehiculoActivo.marca}` : ''}
                        </div>
                      )}
                      <button
                        className="btn btn--ghost btn--sm dashboard-nuevo-viaje-btn"
                        onClick={() => setModalCamioneroId(c.id)}
                      >
                        + Nuevo viaje
                      </button>
                    </td>
                  )

                  const proxCell_td = (
                    <td rowSpan={rowspan} className="dashboard-prox-cell">
                      {proxCell}
                    </td>
                  )

                  // Fila libre
                  if (esLibre) {
                    return [
                      <tr key={`g-${c.id}`} className="dashboard-group-row">
                        {camioneroCell}
                        <td></td>
                        <td colSpan={4} style={{ opacity: 0.55 }}>
                          <span className="badge-libre">Libre</span>
                        </td>
                        <td></td>
                        {proxCell_td}
                        <td></td>
                      </tr>,
                      <tr key={`sep-${c.id}`} className="dashboard-spacer"><td colSpan={COLS + 1}></td></tr>,
                    ]
                  }

                  // Filas con viajes
                  return [
                    ...vd.map((v, idx) => {
                      const esPrimero   = idx === 0
                      const esPendiente = v.estado === 'pendiente'
                      const idxPend     = pendientesDriver.findIndex((p) => p.id === v.id)
                      const puedeSubir  = esPendiente && idxPend > 0
                      const puedeBajar  = esPendiente && idxPend < pendientesDriver.length - 1
                      const enRe        = reordenando === v.id

                      return (
                        <tr key={v.id} className={`dashboard-group-row${esPrimero ? ' dashboard-group-row--first' : ''}`}>
                          {esPrimero ? camioneroCell : null}

                          {/* Flechas orden */}
                          <td className="dashboard-orden-cell">
                            {esPendiente && (
                              <div className="dashboard-orden-btns">
                                <button
                                  className="btn-orden"
                                  title="Mover arriba"
                                  disabled={!puedeSubir || enRe}
                                  onClick={() => handleMover(c.id, v.id, 'arriba')}
                                >▲</button>
                                <button
                                  className="btn-orden"
                                  title="Mover abajo"
                                  disabled={!puedeBajar || enRe}
                                  onClick={() => handleMover(c.id, v.id, 'abajo')}
                                >▼</button>
                              </div>
                            )}
                          </td>

                          <td style={{ fontSize: 13 }}>{v.origen  ?? <Dash />}</td>
                          <td style={{ fontSize: 13 }}>{v.destino ?? <Dash />}</td>
                          <td>{v.tipo ? <TipoBadge tipo={v.tipo} /> : <Dash />}</td>
                          <td>
                            <span className={`badge badge--${v.estado}`}>
                              {ESTADO_LABELS[v.estado] ?? v.estado}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                            {fmtFecha(v.fecha_inicio) ?? <Dash />}
                          </td>

                          {esPrimero ? proxCell_td : null}

                          <td>
                            <div className="dashboard-actions">
                              {esPendiente && (
                                <button
                                  className="btn btn--primary btn--sm"
                                  disabled={comenzando === v.id}
                                  onClick={() => handleComenzar(v.id)}
                                  style={{ whiteSpace: 'nowrap' }}
                                >
                                  {comenzando === v.id ? '…' : '▶ Comenzar'}
                                </button>
                              )}
                              <Link to={`/viajes/${v.id}`} className="btn btn--ghost btn--sm" style={{ whiteSpace: 'nowrap' }}>
                                Ver viaje
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    }),
                    // Fila separadora entre grupos — evita bordes rotos con rowspan
                    <tr key={`sep-${c.id}`} className="dashboard-spacer">
                      <td colSpan={COLS + 1}></td>
                    </tr>,
                  ]
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
  return <span style={{ color: 'var(--color-text-muted)', opacity: 0.35 }}>—</span>
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
