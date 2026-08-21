import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getViajes, getViajesSinConductor, cambiarEstado, cambiarOrden, asignarCamionero, deleteViaje } from '../../services/viajes'
import { getCamionerosAlmacen } from '../../services/camioneros'
import { getAlmacenes } from '../../services/almacenes'
import { useAuth } from '../../context/AuthContext'
import Pagination from '../../components/Pagination'
import NuevoViaje from './NuevoViaje'

const PER_PAGE = 20

const TIPO_LABELS = {
  carga_completa:   'Carga Completa',
  descarga_completa:'Descarga Completa',
  dormir:           'Dormir',
  vacio:            'Vacío',
  carga_parcial:    'Carga Parcial',
  descarga_parcial: 'Descarga Parcial',
  // compatibilidad
  carga:            'Carga',
  descarga:         'Descarga',
  adelantar_carga:  'Adelantar carga',
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

function buildGrupos(camioneros, viajes, filtroAlmacenes) {
  let drivers = camioneros
  if (filtroAlmacenes.length > 0) {
    drivers = camioneros.filter((c) => filtroAlmacenes.includes(String(c.almacen_id)))
  }
  return drivers.map((c) => {
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

const COLS = 7 // número total de columnas de la tabla principal

// Flujos de estados por tipo de viaje (igual que ViajeDetalle)
const FLUJOS = {
  carga_completa:   ['pendiente', 'en_camino', 'llegada_destino', 'cargando',    'finalizado'],
  descarga_completa:['pendiente', 'en_camino', 'llegada_destino', 'descargando', 'finalizado'],
  dormir:           ['pendiente', 'en_camino', 'llegada_destino',                'finalizado'],
  vacio:            ['pendiente', 'en_camino', 'llegada_destino',                'finalizado'],
  carga_parcial:    ['pendiente', 'en_camino', 'llegada_destino', 'cargando',    'finalizado'],
  descarga_parcial: ['pendiente', 'en_camino', 'llegada_destino', 'descargando', 'finalizado'],
  carga:            ['pendiente', 'en_camino', 'llegada_destino', 'cargando',    'finalizado'],
  descarga:         ['pendiente', 'en_camino', 'llegada_destino', 'descargando', 'finalizado'],
  adelantar_carga:  ['pendiente', 'en_camino', 'llegada_destino',                'finalizado'],
}

function getSiguienteEstado(estado, tipo) {
  const flujo = FLUJOS[tipo] ?? ['pendiente', 'en_camino', 'llegada_destino', 'finalizado']
  const idx = flujo.indexOf(estado)
  if (idx === -1 || idx >= flujo.length - 1) return null
  return flujo[idx + 1]
}

const ACCION_BTN_LABEL = {
  en_camino:       '▶ Comenzar',
  llegada_destino: 'En destino',
  cargando:        'Iniciar carga',
  descargando:     'Iniciar descarga',
  finalizado:      '✓ Finalizar',
}

export default function DashboardAdmin() {
  const { isAdmin } = useAuth()

  const [viajes, setViajes]                     = useState([])
  const [viajesSinConductor, setVSC]            = useState([])
  const [camioneros, setCamioneros]             = useState([])
  const [almacenes, setAlmacenes]               = useState([])
  const [loading, setLoading]                   = useState(true)
  const [query, setQuery]                       = useState('')
  const [page, setPage]                         = useState(1)
  const [filtroAlmacenes, setFiltroAlmacenes]   = useState([])
  const [comenzando, setComenzando]             = useState(null)
  const [reordenando, setReordenando]           = useState(null)
  const [asignando, setAsignando]               = useState(null)
  const [modalCamionero, setModalCamionero]     = useState(null)
  const [modalAsignar, setModalAsignar]         = useState(null) // { viajeId }
  const [asignarForm, setAsignarForm]           = useState({ camionero_id: '', vehiculo_id: '' })
  const [eliminando, setEliminando]             = useState(null)
  const [now, setNow]                           = useState(new Date())

  const cargar = () =>
    Promise.all([
      getViajes(),
      getCamionerosAlmacen(),
      isAdmin() ? getAlmacenes() : Promise.resolve({ data: { data: [] } }),
      getViajesSinConductor(),
    ])
      .then(([vRes, cRes, aRes, vscRes]) => {
        setViajes(vRes.data.data         ?? [])
        setCamioneros(cRes.data.data     ?? [])
        setAlmacenes(aRes.data.data      ?? [])
        setVSC(vscRes.data.data          ?? [])
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

  const handleAvanzarEstado = async (viajeId, estadoActual, tipo) => {
    const siguiente = getSiguienteEstado(estadoActual, tipo)
    if (!siguiente) return
    setComenzando(viajeId)
    try { await cambiarEstado(viajeId, siguiente); await cargar() }
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

  const handleEliminar = async (viajeId) => {
    setEliminando(viajeId)
    try { await deleteViaje(viajeId); await cargar() }
    catch { /* silencioso */ }
    finally { setEliminando(null) }
  }

  const abrirAsignar = (viajeId) => {
    setAsignarForm({ camionero_id: '', vehiculo_id: '' })
    setModalAsignar({ viajeId })
  }

  const handleAsignar = async (e) => {
    e.preventDefault()
    setAsignando(modalAsignar.viajeId)
    try {
      const payload = {}
      if (asignarForm.camionero_id) payload.camionero_id = asignarForm.camionero_id
      if (asignarForm.vehiculo_id)  payload.vehiculo_id  = asignarForm.vehiculo_id
      await asignarCamionero(modalAsignar.viajeId, payload)
      setModalAsignar(null)
      await cargar()
    } catch { /* silencioso */ }
    finally { setAsignando(null) }
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>

  const activos    = viajes.filter((v) => ESTADOS_ACTIVOS.includes(v.estado))
  const pendientes = viajes.filter((v) => v.estado === 'pendiente')
  const hoy        = now.toISOString().slice(0, 10)
  const finHoy     = viajes.filter((v) => v.estado === 'finalizado' && v.fecha_fin === hoy)
  const enViaje    = camioneros.filter((c) => activos.some((v) => v.camionero_id === c.id))
  const libres     = camioneros.filter((c) => !activos.some((v) => v.camionero_id === c.id))

  const todosGrupos     = buildGrupos(camioneros, viajes, filtroAlmacenes)
  const gruposFiltrados = filtrarGrupos(todosGrupos, query)
  const gruposPagina    = gruposFiltrados.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const toggleAlmacen = (id) => {
    setFiltroAlmacenes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
    setPage(1)
  }

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
          onClick={() => setModalCamionero({ id: '', vehiculoId: '' })}
          style={{ fontSize: 15, padding: '10px 24px', fontWeight: 600 }}
        >
          + Nuevo viaje
        </button>
      </div>

      {/* Estadísticas */}
      <div className="stats-row" style={{ marginBottom: 20 }}>
        <StatCard label="Camioneros en viaje" value={enViaje.length}    color="var(--color-primary)" />
        <StatCard label="Camioneros libres"   value={libres.length}     color="#66bb6a" />
        <StatCard label="Viajes pendientes"   value={pendientes.length} color="#ffc107" />
        <StatCard label="Finalizados hoy"     value={finHoy.length}     color="#90a4ae" />
      </div>

      {/* Filtro almacén (solo superadmin) */}
      {isAdmin() && almacenes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '0 0 20px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', alignSelf: 'center', marginRight: 4 }}>
            Almacén:
          </span>
          {almacenes.map((a) => {
            const activo = filtroAlmacenes.includes(String(a.id))
            return (
              <button key={a.id} onClick={() => toggleAlmacen(String(a.id))} className={`chip${activo ? ' chip--active' : ''}`}>
                {a.nombre}
              </button>
            )
          })}
          {filtroAlmacenes.length > 0 && (
            <button onClick={() => { setFiltroAlmacenes([]); setPage(1) }} style={{ fontSize: 11, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', textDecoration: 'underline', padding: '0 4px' }}>
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Viajes sin conductor */}
      {viajesSinConductor.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p className="card__title" style={{ margin: 0 }}>
              Viajes sin conductor
              <span style={{
                marginLeft: 8, fontSize: 12, fontWeight: 600,
                background: 'rgba(186,53,52,0.15)', color: 'var(--color-primary)',
                padding: '2px 8px', borderRadius: 4,
              }}>
                {viajesSinConductor.length}
              </span>
            </p>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {viajesSinConductor.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontSize: 13 }}>{v.origen  ?? <Dash />}</td>
                    <td style={{ fontSize: 13 }}>{v.destino ?? <Dash />}</td>
                    <td>{v.tipo ? <TipoBadge tipo={v.tipo} /> : <Dash />}</td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {fmtFecha(v.fecha_inicio) ?? <Dash />}
                    </td>
                    <td>
                      <div className="dashboard-actions">
                        <button
                          className="btn btn--primary btn--sm"
                          onClick={() => abrirAsignar(v.id)}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          Asignar camionero
                        </button>
                        <Link to={`/viajes/${v.id}`} className="btn btn--ghost btn--sm" style={{ whiteSpace: 'nowrap' }}>
                          Ver viaje
                        </Link>
                        <button
                          className="btn btn--ghost btn--sm"
                          disabled={eliminando === v.id}
                          onClick={() => handleEliminar(v.id)}
                          title="Eliminar viaje"
                          style={{ padding: '5px 9px', color: '#e57373' }}
                        >
                          {eliminando === v.id ? '…' : '🗑'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla de camioneros */}
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
            {gruposFiltrados.length} de {todosGrupos.length} camioneros
          </span>
        </div>

        {todosGrupos.length === 0 ? (
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
                  <th style={{ width: 42, textAlign: 'center' }}>#</th>{/* columna orden numérico */}
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th style={{ width: 72 }}>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {gruposPagina.map(({ camionero: c, viajes: vd }) => {
                  const pendientesDriver = vd.filter((v) => v.estado === 'pendiente')
                  const esLibre          = vd.length === 0
                  const rowspan          = esLibre ? 1 : vd.length

                  const vehiculoActivo = vd[0]?.vehiculo ?? null

                  const camioneroCell = (
                    <td rowSpan={rowspan} className="dashboard-driver-cell">
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
                        onClick={() => setModalCamionero({ id: c.id, vehiculoId: c.vehiculo?.id ?? '' })}
                      >
                        + Nuevo viaje
                      </button>
                    </td>
                  )

                  // Fila libre
                  if (esLibre) {
                    return [
                      <tr key={`g-${c.id}`} className="dashboard-group-row">
                        {camioneroCell}
                        <td></td>
                        <td></td>
                        <td colSpan={4} style={{ opacity: 0.55 }}>
                          <span className="badge-libre">Libre</span>
                        </td>
                        <td></td>
                        <td></td>
                      </tr>,
                      <tr key={`sep-${c.id}`} className="dashboard-spacer"><td colSpan={COLS + 2}></td></tr>,
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

                      // Número de orden visible para pendientes
                      const numOrden = esPendiente ? (idxPend + 1) : null

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

                          {/* Columna orden numérico */}
                          <td style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)' }}>
                            {numOrden ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 24, height: 24,
                                borderRadius: '50%',
                                background: 'rgba(186,53,52,0.15)',
                                color: 'var(--color-primary)',
                                fontWeight: 700,
                                fontSize: 12,
                              }}>
                                {numOrden}
                              </span>
                            ) : null}
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

                          <td>
                            <div className="dashboard-actions">
                              {(() => {
                                const siguiente = getSiguienteEstado(v.estado, v.tipo)
                                if (!siguiente) return null
                                const esFinalizar = siguiente === 'finalizado'
                                return (
                                  <button
                                    className={`btn btn--sm ${esFinalizar ? 'btn--success' : 'btn--primary'}`}
                                    disabled={comenzando === v.id}
                                    onClick={() => handleAvanzarEstado(v.id, v.estado, v.tipo)}
                                    style={{ whiteSpace: 'nowrap' }}
                                  >
                                    {comenzando === v.id ? '…' : ACCION_BTN_LABEL[siguiente]}
                                  </button>
                                )
                              })()}
                              <Link to={`/viajes/${v.id}`} className="btn btn--ghost btn--sm" style={{ whiteSpace: 'nowrap' }}>
                                Ver viaje
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    }),
                    <tr key={`sep-${c.id}`} className="dashboard-spacer">
                      <td colSpan={COLS + 2}></td>
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

      {/* Modal nuevo viaje */}
      {modalCamionero !== null && (
        <NuevoViaje
          defaultCamioneroId={modalCamionero.id}
          defaultVehiculoId={modalCamionero.vehiculoId}
          onClose={() => setModalCamionero(null)}
          onCreated={() => { setLoading(true); cargar() }}
        />
      )}

      {/* Modal asignar camionero a viaje sin conductor */}
      {modalAsignar && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 12, padding: 24, maxWidth: 420, width: '100%',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Asignar camionero</h3>
              <button className="btn btn--ghost btn--sm" onClick={() => setModalAsignar(null)}>✕</button>
            </div>

            <form onSubmit={handleAsignar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Camionero</label>
                <select
                  value={asignarForm.camionero_id}
                  onChange={(e) => setAsignarForm((p) => ({ ...p, camionero_id: e.target.value }))}
                >
                  <option value="">— Seleccionar —</option>
                  {camioneros.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.apellidos}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setModalAsignar(null)}>Cancelar</button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={!asignarForm.camionero_id || asignando === modalAsignar.viajeId}
                >
                  {asignando === modalAsignar.viajeId ? 'Asignando…' : 'Asignar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Dash() {
  return <span style={{ color: 'var(--color-text-muted)', opacity: 0.35 }}>—</span>
}

function TipoBadge({ tipo }) {
  const colors = {
    carga_completa:   { bg: 'rgba(33,150,243,0.12)',  fg: '#64b5f6' },
    descarga_completa:{ bg: 'rgba(255,152,0,0.12)',   fg: '#ffb74d' },
    dormir:           { bg: 'rgba(76,175,80,0.12)',   fg: '#81c784' },
    vacio:            { bg: 'rgba(150,150,150,0.10)', fg: '#aaa' },
    carga_parcial:    { bg: 'rgba(33,150,243,0.08)',  fg: '#90caf9' },
    descarga_parcial: { bg: 'rgba(255,152,0,0.08)',   fg: '#ffcc80' },
    // compatibilidad
    carga:            { bg: 'rgba(33,150,243,0.12)',  fg: '#64b5f6' },
    descarga:         { bg: 'rgba(255,152,0,0.12)',   fg: '#ffb74d' },
    adelantar_carga:  { bg: 'rgba(76,175,80,0.12)',   fg: '#81c784' },
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
