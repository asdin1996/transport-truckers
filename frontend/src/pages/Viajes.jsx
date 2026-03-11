import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getViajes, updateViaje } from '../services/viajes'
import { getCamioneros } from '../services/camioneros'
import { getVehiculos } from '../services/vehiculos'
import { getRutas } from '../services/rutas'
import Pagination from '../components/Pagination'
import useTableFilter from '../hooks/useTableFilter'

const PER_PAGE = 10

const ESTADO_LABELS = {
  pendiente:  'Pendiente',
  en_curso:   'En curso',
  completado: 'Completado',
  cancelado:  'Cancelado',
}

const SEARCH_FIELDS = [
  (v) => `${v.camionero?.nombre ?? ''} ${v.camionero?.apellidos ?? ''}`,
  (v) => `${v.ruta?.origen ?? ''} ${v.ruta?.destino ?? ''}`,
  (v) => v.vehiculo?.matricula ?? '',
  'estado',
]

const SORT_GETTERS = {
  camionero:   (v) => `${v.camionero?.nombre ?? ''} ${v.camionero?.apellidos ?? ''}`,
  ruta:        (v) => `${v.ruta?.origen ?? ''} → ${v.ruta?.destino ?? ''}`,
  fecha_inicio:(v) => v.fecha_inicio ?? '',
  fecha_fin:   (v) => v.fecha_fin ?? '',
}

function SortIcon({ col, sort }) {
  const active = sort.col === col
  return (
    <span className={`sort-icon${active ? ' sort-icon--active' : ''}`}>
      {active ? (sort.dir === 'asc' ? '▲' : '▼') : '▲▼'}
    </span>
  )
}

export default function Viajes() {
  const { user, isAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [viajes, setViajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState(searchParams.get('estado') ?? 'todos')
  const [page, setPage] = useState(1)

  // Modal edición
  const [editModal, setEditModal]   = useState(false)
  const [editViaje, setEditViaje]   = useState(null)
  const [editForm, setEditForm]     = useState({})
  const [editOpts, setEditOpts]     = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError]   = useState(null)

  const cargar = () =>
    getViajes()
      .then((res) => setViajes(res.data.data ?? []))
      .catch(() => setError('Error al cargar los viajes.'))
      .finally(() => setLoading(false))

  useEffect(() => { cargar() }, [])

  const base = filtro === 'todos' ? viajes : viajes.filter((v) => v.estado === filtro)

  const { query, setQuery, sort, toggleSort, processed } = useTableFilter(base, SEARCH_FIELDS, SORT_GETTERS)

  const cambiarFiltro = (estado) => {
    setFiltro(estado)
    setPage(1)
    setSearchParams(estado === 'todos' ? {} : { estado })
  }

  const doSearch = (q) => { setQuery(q); setPage(1) }
  const doSort   = (col) => { toggleSort(col); setPage(1) }

  const lista = processed.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // ── Edición ──────────────────────────────────────────────────
  const abrirEdicion = async (v) => {
    setEditViaje(v)
    setEditError(null)
    setEditForm({
      camionero_id: v.camionero_id ?? '',
      vehiculo_id:  v.vehiculo_id  ?? '',
      ruta_id:      v.ruta_id      ?? '',
      estado:       v.estado       ?? 'pendiente',
      fecha_inicio: v.fecha_inicio ? v.fecha_inicio.slice(0, 10) : '',
      fecha_fin:    v.fecha_fin    ? v.fecha_fin.slice(0, 10)    : '',
      notas:        v.notas        ?? '',
    })
    if (!editOpts) {
      try {
        const [cRes, vRes, rRes] = await Promise.all([getCamioneros(), getVehiculos(), getRutas()])
        setEditOpts({
          camioneros: cRes.data.data ?? [],
          vehiculos:  vRes.data.data ?? [],
          rutas:      rRes.data.data ?? [],
        })
      } catch {
        setEditError('No se pudieron cargar los datos.')
      }
    }
    setEditModal(true)
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setEditSaving(true)
    setEditError(null)
    try {
      const payload = { ...editForm }
      if (!payload.fecha_inicio) delete payload.fecha_inicio
      if (!payload.fecha_fin)    delete payload.fecha_fin
      if (!payload.notas)        delete payload.notas
      await updateViaje(editViaje.id, payload)
      setEditModal(false)
      await cargar()
    } catch (err) {
      const msgs = err.response?.data?.errors
      setEditError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al guardar.')
    } finally {
      setEditSaving(false)
    }
  }

  const setField = (f) => (e) => setEditForm((prev) => ({ ...prev, [f]: e.target.value }))

  const puedeEditar = (v) =>
    isAdmin() || (v.estado === 'pendiente' && v.camionero?.user_id === user?.id)

  // ─────────────────────────────────────────────────────────────

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>
  if (error)   return <div className="alert alert--error">{error}</div>

  return (
    <div>
      <div className="page-header">
        <h2>{isAdmin() ? 'Viajes' : 'Mis Viajes'}</h2>
        {isAdmin() && (
          <Link to="/viajes/nuevo" className="btn btn--primary btn--sm">+ Nuevo viaje</Link>
        )}
      </div>

      <div className="filter-tabs">
        {['todos', 'pendiente', 'en_curso', 'completado', 'cancelado'].map((e) => (
          <button
            key={e}
            className={`filter-tab${filtro === e ? ' active' : ''}`}
            onClick={() => cambiarFiltro(e)}
          >
            {e === 'todos' ? 'Todos' : ESTADO_LABELS[e]}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-controls">
          <div className="table-search">
            <span className="table-search__icon">⌕</span>
            <input
              value={query}
              onChange={(e) => doSearch(e.target.value)}
              placeholder="Buscar por camionero, ruta, matrícula…"
            />
          </div>
        </div>

        {lista.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No hay viajes.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {isAdmin() && (
                    <th className="th--sortable" onClick={() => doSort('camionero')}>
                      Camionero <SortIcon col="camionero" sort={sort} />
                    </th>
                  )}
                  <th className="th--sortable" onClick={() => doSort('ruta')}>
                    Ruta <SortIcon col="ruta" sort={sort} />
                  </th>
                  <th>Vehículo</th>
                  <th className="th--sortable" onClick={() => doSort('estado')}>
                    Estado <SortIcon col="estado" sort={sort} />
                  </th>
                  <th className="th--sortable" onClick={() => doSort('fecha_inicio')}>
                    Inicio <SortIcon col="fecha_inicio" sort={sort} />
                  </th>
                  <th className="th--sortable" onClick={() => doSort('fecha_fin')}>
                    Fin <SortIcon col="fecha_fin" sort={sort} />
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((v) => (
                  <tr key={v.id}>
                    {isAdmin() && <td>{v.camionero?.nombre} {v.camionero?.apellidos}</td>}
                    <td>{v.ruta?.origen ?? '—'} → {v.ruta?.destino ?? '—'}</td>
                    <td>{v.vehiculo?.matricula ?? '—'}</td>
                    <td>
                      <span className={`badge badge--${v.estado}`}>
                        {ESTADO_LABELS[v.estado]}
                      </span>
                    </td>
                    <td>{v.fecha_inicio ? new Date(v.fecha_inicio).toLocaleDateString('es-ES') : '—'}</td>
                    <td>{v.fecha_fin ? new Date(v.fecha_fin).toLocaleDateString('es-ES') : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {puedeEditar(v) && (
                          <button className="btn btn--ghost btn--sm" onClick={() => abrirEdicion(v)}>
                            Editar
                          </button>
                        )}
                        <Link to={`/viajes/${v.id}`} className="btn btn--ghost btn--sm">
                          Ver
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} total={processed.length} perPage={PER_PAGE} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Modal edición */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Editar viaje</h3>
              <button className="modal__close" onClick={() => setEditModal(false)}>✕</button>
            </div>

            {editError && <div className="alert alert--error">{editError}</div>}

            <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isAdmin() && editOpts && (
                <>
                  <div className="form-group">
                    <label>Camionero</label>
                    <select value={editForm.camionero_id} onChange={setField('camionero_id')} required>
                      <option value="">Seleccionar…</option>
                      {editOpts.camioneros.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre} {c.apellidos}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Vehículo</label>
                    <select value={editForm.vehiculo_id} onChange={setField('vehiculo_id')}>
                      <option value="">Sin vehículo</option>
                      {editOpts.vehiculos.map((v) => (
                        <option key={v.id} value={v.id}>{v.matricula} — {v.marca} {v.modelo}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ruta</label>
                    <select value={editForm.ruta_id} onChange={setField('ruta_id')}>
                      <option value="">Sin ruta</option>
                      {editOpts.rutas.map((r) => (
                        <option key={r.id} value={r.id}>{r.origen} → {r.destino} ({r.km_estimados} km)</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estado</label>
                    <select value={editForm.estado} onChange={setField('estado')}>
                      <option value="pendiente">Pendiente</option>
                      <option value="en_curso">En curso</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Fecha prevista inicio</label>
                      <input type="date" value={editForm.fecha_inicio} onChange={setField('fecha_inicio')} />
                    </div>
                    <div className="form-group">
                      <label>Fecha prevista fin</label>
                      <input type="date" value={editForm.fecha_fin} onChange={setField('fecha_fin')} />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Notas</label>
                <textarea
                  value={editForm.notas}
                  onChange={setField('notas')}
                  rows={3}
                  placeholder="Instrucciones especiales…"
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary" disabled={editSaving}>
                  {editSaving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
