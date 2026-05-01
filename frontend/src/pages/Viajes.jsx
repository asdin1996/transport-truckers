import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Combobox from '../components/Combobox'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import { getViajes, updateViaje } from '../services/viajes'
import { getCamioneros } from '../services/camioneros'
import { getVehiculos } from '../services/vehiculos'
import { getParadas } from '../services/paradas'
import Pagination from '../components/Pagination'
import useTableFilter from '../hooks/useTableFilter'
import NuevoViaje from './admin/NuevoViaje'
import ExportarViajes from '../components/ExportarViajes'

const PER_PAGE = 10

const ESTADO_LABELS = {
  pendiente:   'Pendiente',
  en_camino:   'En camino',
  cargando:    'Cargando',
  descargando: 'Descargando',
  finalizado:  'Finalizado',
  cancelado:   'Cancelado',
}

const SEARCH_FIELDS = [
  (v) => `${v.camionero?.nombre ?? ''} ${v.camionero?.apellidos ?? ''}`,
  (v) => `${v.origen ?? ''} ${v.destino ?? ''}`,
  (v) => v.vehiculo?.matricula ?? '',
  'estado',
]

const SORT_GETTERS = {
  camionero:    (v) => `${v.camionero?.nombre ?? ''} ${v.camionero?.apellidos ?? ''}`,
  origen:       (v) => v.origen ?? '',
  destino:      (v) => v.destino ?? '',
  fecha_inicio: (v) => v.fecha_inicio ?? '',
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
  const [viajes, setViajes]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [filtro, setFiltro]     = useState(searchParams.get('estado') ?? 'todos')
  const [page, setPage]         = useState(1)
  const [modalNuevo, setModalNuevo]       = useState(false)
  const [modalExportar, setModalExportar] = useState(false)

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
  const lista    = processed.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const abrirEdicion = async (v) => {
    setEditViaje(v)
    setEditError(null)
    setEditForm({
      camionero_id: v.camionero_id ?? '',
      vehiculo_id:  v.vehiculo_id  ?? '',
      tipo:         v.tipo         ?? 'carga',
      origen:       v.origen       ?? '',
      destino:      v.destino      ?? '',
      estado:       v.estado       ?? 'pendiente',
      fecha_inicio: v.fecha_inicio ? v.fecha_inicio.slice(0, 10) : '',
      fecha_fin:    v.fecha_fin    ? v.fecha_fin.slice(0, 10)    : '',
      notas:        v.notas        ?? '',
    })
    if (!editOpts) {
      try {
        const [cRes, vRes, pRes] = await Promise.all([getCamioneros(), getVehiculos(), getParadas()])
        setEditOpts({
          camioneros: cRes.data.data ?? [],
          vehiculos:  vRes.data.data ?? [],
          paradas:    pRes.data.data ?? [],
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
  const puedeEditar = (v) => isAdmin() || (['pendiente', 'en_camino'].includes(v.estado) && v.camionero?.user_id === user?.id)

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>
  if (error)   return <div className="alert alert--error">{error}</div>

  return (
    <div>
      {/* Cabecera */}
      <div className="page-header">
        <h2>{isAdmin() ? 'Viajes' : 'Mis Viajes'}</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn--ghost" onClick={() => setModalExportar(true)} style={{ fontSize: 15, padding: '10px 20px', fontWeight: 600 }}>
            ↓ Exportar
          </button>
          {isAdmin() && (
            <button className="btn btn--primary" onClick={() => setModalNuevo(true)} style={{ fontSize: 15, padding: '10px 24px', fontWeight: 600 }}>
              + Nuevo viaje
            </button>
          )}
        </div>
      </div>

      {/* Filtros de estado */}
      <div className="filter-tabs">
        {['todos', 'pendiente', 'en_camino', 'cargando', 'descargando', 'finalizado', 'cancelado'].map((e) => (
          <button
            key={e}
            className={`filter-tab${filtro === e ? ' active' : ''}`}
            onClick={() => cambiarFiltro(e)}
          >
            {e === 'todos' ? 'Todos' : ESTADO_LABELS[e]}
            <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.7 }}>
              ({e === 'todos' ? viajes.length : viajes.filter((v) => v.estado === e).length})
            </span>
          </button>
        ))}
      </div>

      <div className="card">
        {/* Buscador + contador */}
        <div className="table-controls">
          <div className="table-search">
            <span className="table-search__icon">⌕</span>
            <input
              value={query}
              onChange={(e) => doSearch(e.target.value)}
              placeholder="Buscar por camionero, origen, destino, matrícula…"
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {processed.length} resultado{processed.length !== 1 ? 's' : ''}
          </span>
        </div>

        {lista.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: '8px 0' }}>
            No hay viajes.
          </p>
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
                  <th className="th--sortable" onClick={() => doSort('origen')}>
                    Origen <SortIcon col="origen" sort={sort} />
                  </th>
                  <th className="th--sortable" onClick={() => doSort('destino')}>
                    Destino <SortIcon col="destino" sort={sort} />
                  </th>
                  <th>Vehículo</th>
                  <th>Estado</th>
                  <th className="th--sortable" onClick={() => doSort('fecha_inicio')}>
                    Inicio <SortIcon col="fecha_inicio" sort={sort} />
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((v) => (
                  <tr key={v.id}>
                    {isAdmin() && <td>{v.camionero?.nombre} {v.camionero?.apellidos}</td>}
                    <td>{v.origen ?? '—'}</td>
                    <td>{v.destino ?? '—'}</td>
                    <td>{v.vehiculo?.matricula ?? '—'}</td>
                    <td>
                      <span className={`badge badge--${v.estado}`}>
                        {ESTADO_LABELS[v.estado]}
                      </span>
                    </td>
                    <td>
                      {v.fecha_inicio
                        ? new Date(v.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES')
                        : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {puedeEditar(v) && (
                          <button className="btn btn--ghost btn--sm" onClick={() => abrirEdicion(v)}>
                            Editar
                          </button>
                        )}
                        <Link to={`/viajes/${v.id}`} className="btn btn--ghost btn--sm">Ver</Link>
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

      {/* Modal nuevo viaje */}
      {modalNuevo && (
        <NuevoViaje
          onClose={() => setModalNuevo(false)}
          onCreated={() => { setLoading(true); cargar() }}
        />
      )}

      {/* Modal exportar */}
      {modalExportar && (
        <ExportarViajes
          viajes={viajes}
          onClose={() => setModalExportar(false)}
        />
      )}

      {/* Modal edición */}
      {editModal && (
        <Modal onClose={() => setEditModal(false)} maxWidth={560}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Editar viaje</h3>
              <button className="btn btn--ghost btn--sm" onClick={() => setEditModal(false)}>✕</button>
            </div>

            {editError && <div className="alert alert--error" style={{ marginBottom: 12 }}>{editError}</div>}

            <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isAdmin() && editOpts && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tipo</label>
                      <select value={editForm.tipo} onChange={setField('tipo')}>
                        <option value="carga">Carga</option>
                        <option value="descarga">Descarga</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Estado</label>
                      <select value={editForm.estado} onChange={setField('estado')}>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_camino">En camino</option>
                        <option value="cargando">Cargando</option>
                        <option value="descargando">Descargando</option>
                        <option value="finalizado">Finalizado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Origen</label>
                      <Combobox
                        value={editForm.origen}
                        onChange={(v) => setEditForm((p) => ({ ...p, origen: v }))}
                        options={editOpts.paradas.map((p) => p.nombre)}
                        placeholder="Buscar origen…"
                      />
                    </div>
                    <div className="form-group">
                      <label>Destino</label>
                      <Combobox
                        value={editForm.destino}
                        onChange={(v) => setEditForm((p) => ({ ...p, destino: v }))}
                        options={editOpts.paradas.map((p) => p.nombre)}
                        placeholder="Buscar destino…"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Camionero <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                    <select value={editForm.camionero_id} onChange={setField('camionero_id')}>
                      <option value="">Sin asignar</option>
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
                  <div className="form-row">
                    <div className="form-group">
                      <label>Fecha inicio</label>
                      <input type="date" value={editForm.fecha_inicio} onChange={setField('fecha_inicio')} />
                    </div>
                    <div className="form-group">
                      <label>Fecha fin estimada</label>
                      <input type="date" value={editForm.fecha_fin} onChange={setField('fecha_fin')} />
                    </div>
                  </div>
                </>
              )}
              <div className="form-group">
                <label>Notas</label>
                <textarea value={editForm.notas} onChange={setField('notas')} rows={3} placeholder="Instrucciones especiales…" />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setEditModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn--primary" disabled={editSaving}>
                  {editSaving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
        </Modal>
      )}
    </div>
  )
}
