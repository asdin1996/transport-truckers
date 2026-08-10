import { useEffect, useState } from 'react'
import { getCamioneros, createCamionero, updateCamionero, deleteCamionero } from '../../services/camioneros'
import { getAlmacenes } from '../../services/almacenes'
import api from '../../services/api'
import Pagination from '../../components/Pagination'
import useTableFilter from '../../hooks/useTableFilter'

const PER_PAGE = 10

const EMPTY = { nombre: '', apellidos: '', email: '', telefono: '', dni: '', fecha_nacimiento: '', rol: 'camionero', almacen_id: '' }

const SEARCH_FIELDS = [
  (c) => `${c.nombre} ${c.apellidos}`,
  'email',
  'dni',
  'telefono',
]

const SORT_GETTERS = {
  nombre: (c) => `${c.nombre} ${c.apellidos}`,
}

function SortIcon({ col, sort }) {
  const active = sort.col === col
  return (
    <span className={`sort-icon${active ? ' sort-icon--active' : ''}`}>
      {active ? (sort.dir === 'asc' ? '▲' : '▼') : '▲▼'}
    </span>
  )
}

export default function Camioneros() {
  const [lista, setLista] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const cargar = () =>
    getCamioneros()
      .then((r) => setLista(r.data.data ?? []))
      .catch(() => setError('Error al cargar camioneros.'))
      .finally(() => setLoading(false))

  useEffect(() => {
    cargar()
    getAlmacenes().then((r) => setAlmacenes(r.data.data ?? []))
  }, [])

  const enViaje = lista.filter((c) => c.en_viaje)
  const libres  = lista.filter((c) => !c.en_viaje)
  const base    = filtro === 'en_viaje' ? enViaje : filtro === 'libres' ? libres : lista

  const { query, setQuery, sort, toggleSort, processed } = useTableFilter(base, SEARCH_FIELDS, SORT_GETTERS)

  const doSearch  = (q) => { setQuery(q); setPage(1) }
  const doSort    = (col) => { toggleSort(col); setPage(1) }
  const doFiltro  = (f) => { setFiltro(f); setPage(1) }

  const listPaginada = processed.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const [almacenes, setAlmacenes] = useState([])
  const [syncing, setSyncing]     = useState(false)
  const [syncMsg, setSyncMsg]     = useState(null)

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await api.post('/mapon/sync/camioneros')
      const d = res.data.data
      setSyncMsg(`${d.created} creados · ${d.updated} actualizados · ${d.skipped} omitidos`)
      cargar()
    } catch (err) {
      setSyncMsg(err?.response?.data?.message ?? 'Error al sincronizar.')
    } finally {
      setSyncing(false)
    }
  }

  const abrirNuevo = () => { setForm(EMPTY); setFormError(null); setModal('nuevo') }
  const abrirEditar = (c) => {
    setForm({
      nombre: c.nombre,
      apellidos: c.apellidos,
      email: c.email,
      telefono: c.telefono ?? '',
      dni: c.dni,
      fecha_nacimiento: c.fecha_nacimiento ? c.fecha_nacimiento.slice(0, 10) : '',
      rol:        c.user?.role ?? 'camionero',
      almacen_id: c.almacen_id ?? '',
    })
    setFormError(null)
    setModal(c)
  }
  const cerrar = () => setModal(null)
  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }))

  const guardar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      if (modal === 'nuevo') {
        await createCamionero(form)
      } else {
        await updateCamionero(modal.id, form)
      }
      await cargar()
      cerrar()
    } catch (err) {
      const msgs = err.response?.data?.errors
      setFormError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este camionero?')) return
    try {
      await deleteCamionero(id)
      setLista((prev) => prev.filter((c) => c.id !== id))
    } catch {
      setError('No se pudo eliminar.')
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>

  return (
    <div>
      <div className="page-header">
        <h2>Camioneros</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {syncMsg && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{syncMsg}</span>}
          <button className="btn btn--ghost" onClick={handleSync} disabled={syncing}>
            {syncing ? 'Sincronizando…' : 'Sincronizar Mapon'}
          </button>
          <button className="btn btn--primary" onClick={abrirNuevo}>+ Nuevo camionero</button>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="filter-tabs">
        <button className={`filter-tab${filtro === 'todos' ? ' active' : ''}`} onClick={() => doFiltro('todos')}>
          Todos ({lista.length})
        </button>
        <button className={`filter-tab${filtro === 'libres' ? ' active' : ''}`} onClick={() => doFiltro('libres')}>
          Libres ({libres.length})
        </button>
        <button className={`filter-tab${filtro === 'en_viaje' ? ' active' : ''}`} onClick={() => doFiltro('en_viaje')}>
          En viaje ({enViaje.length})
        </button>
      </div>

      <div className="card">
        <div className="table-controls">
          <div className="table-search">
            <span className="table-search__icon">⌕</span>
            <input
              value={query}
              onChange={(e) => doSearch(e.target.value)}
              placeholder="Buscar por nombre, email, DNI…"
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th className="th--sortable" onClick={() => doSort('nombre')}>
                  Nombre <SortIcon col="nombre" sort={sort} />
                </th>
                <th>Rol</th>
                <th>Estado</th>
                <th className="th--sortable" onClick={() => doSort('email')}>
                  Email <SortIcon col="email" sort={sort} />
                </th>
                <th>Teléfono</th>
                <th className="th--sortable" onClick={() => doSort('dni')}>
                  DNI <SortIcon col="dni" sort={sort} />
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {listPaginada.length === 0 && (
                <tr><td colSpan={6} style={{ color: 'var(--color-text-muted)' }}>Sin resultados.</td></tr>
              )}
              {listPaginada.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombre} {c.apellidos}</td>
                  <td>
                    {c.user?.role === 'admin'
                      ? <span className="badge badge--admin">Admin</span>
                      : <span className="badge badge--camionero">Camionero</span>
                    }
                  </td>
                  <td>
                    {c.en_viaje
                      ? <span className="badge badge--en_curso">En viaje</span>
                      : <span className="badge badge--completado">Libre</span>
                    }
                  </td>
                  <td>{c.email}</td>
                  <td>{c.telefono ?? '—'}</td>
                  <td>{c.dni}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => abrirEditar(c)}>Editar</button>
                      <button className="btn btn--danger btn--sm" onClick={() => eliminar(c.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={processed.length} perPage={PER_PAGE} onChange={setPage} />
      </div>

      {modal && (
        <div className="modal-overlay" onClick={cerrar}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{modal === 'nuevo' ? 'Nuevo camionero' : 'Editar camionero'}</h3>
              <button className="modal__close" onClick={cerrar}>✕</button>
            </div>
            {formError && <div className="alert alert--error">{formError}</div>}
            <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre</label>
                  <input value={form.nombre} onChange={set('nombre')} required />
                </div>
                <div className="form-group">
                  <label>Apellidos</label>
                  <input value={form.apellidos} onChange={set('apellidos')} required />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={set('email')} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input value={form.telefono} onChange={set('telefono')} />
                </div>
                <div className="form-group">
                  <label>DNI</label>
                  <input value={form.dni} onChange={set('dni')} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de nacimiento</label>
                  <input type="date" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} />
                </div>
                <div className="form-group">
                  <label>Rol</label>
                  <select value={form.rol} onChange={set('rol')}>
                    <option value="camionero">Camionero</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Almacén</label>
                <select value={form.almacen_id} onChange={set('almacen_id')}>
                  <option value="">— Sin almacén asignado —</option>
                  {almacenes.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn--ghost" onClick={cerrar}>Cancelar</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
