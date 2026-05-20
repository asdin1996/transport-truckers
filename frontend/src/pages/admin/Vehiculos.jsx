import { useEffect, useState } from 'react'
import { getVehiculos, createVehiculo, updateVehiculo, deleteVehiculo } from '../../services/vehiculos'
import api from '../../services/api'
import Pagination from '../../components/Pagination'
import useTableFilter from '../../hooks/useTableFilter'

const PER_PAGE = 10

const EMPTY = { matricula: '', marca: '', modelo: '', anio: new Date().getFullYear() }

const SEARCH_FIELDS = ['matricula', 'marca', 'modelo', 'anio']

function SortIcon({ col, sort }) {
  const active = sort.col === col
  return (
    <span className={`sort-icon${active ? ' sort-icon--active' : ''}`}>
      {active ? (sort.dir === 'asc' ? '▲' : '▼') : '▲▼'}
    </span>
  )
}

export default function Vehiculos() {
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
    getVehiculos()
      .then((r) => setLista(r.data.data ?? []))
      .catch(() => setError('Error al cargar vehículos.'))
      .finally(() => setLoading(false))

  useEffect(() => { cargar() }, [])

  const enUso       = lista.filter((v) => v.en_viaje)
  const disponibles = lista.filter((v) => !v.en_viaje)
  const base        = filtro === 'en_uso' ? enUso : filtro === 'disponible' ? disponibles : lista

  const { query, setQuery, sort, toggleSort, processed } = useTableFilter(base, SEARCH_FIELDS)

  const doSearch = (q) => { setQuery(q); setPage(1) }
  const doSort   = (col) => { toggleSort(col); setPage(1) }
  const doFiltro = (f) => { setFiltro(f); setPage(1) }

  const listPaginada = processed.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await api.post('/mapon/sync/vehiculos', { limpiar: false })
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
  const abrirEditar = (v) => {
    setForm({ matricula: v.matricula, marca: v.marca, modelo: v.modelo, anio: v.anio })
    setFormError(null)
    setModal(v)
  }
  const cerrar = () => setModal(null)
  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }))

  const guardar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      if (modal === 'nuevo') {
        await createVehiculo(form)
      } else {
        await updateVehiculo(modal.id, form)
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
    if (!confirm('¿Eliminar este vehículo?')) return
    try {
      await deleteVehiculo(id)
      setLista((prev) => prev.filter((v) => v.id !== id))
    } catch {
      setError('No se pudo eliminar.')
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>

  return (
    <div>
      <div className="page-header">
        <h2>Vehículos</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {syncMsg && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{syncMsg}</span>}
          <button className="btn btn--ghost" onClick={handleSync} disabled={syncing}>
            {syncing ? 'Sincronizando…' : 'Sincronizar Mapon'}
          </button>
          <button className="btn btn--primary" onClick={abrirNuevo}>+ Nuevo vehículo</button>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="filter-tabs">
        <button className={`filter-tab${filtro === 'todos' ? ' active' : ''}`} onClick={() => doFiltro('todos')}>
          Todos ({lista.length})
        </button>
        <button className={`filter-tab${filtro === 'disponible' ? ' active' : ''}`} onClick={() => doFiltro('disponible')}>
          Disponible ({disponibles.length})
        </button>
        <button className={`filter-tab${filtro === 'en_uso' ? ' active' : ''}`} onClick={() => doFiltro('en_uso')}>
          En uso ({enUso.length})
        </button>
      </div>

      <div className="card">
        <div className="table-controls">
          <div className="table-search">
            <span className="table-search__icon">⌕</span>
            <input
              value={query}
              onChange={(e) => doSearch(e.target.value)}
              placeholder="Buscar por matrícula, marca, modelo…"
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th className="th--sortable" onClick={() => doSort('matricula')}>
                  Matrícula <SortIcon col="matricula" sort={sort} />
                </th>
                <th>Estado</th>
                <th className="th--sortable" onClick={() => doSort('marca')}>
                  Marca <SortIcon col="marca" sort={sort} />
                </th>
                <th className="th--sortable" onClick={() => doSort('modelo')}>
                  Modelo <SortIcon col="modelo" sort={sort} />
                </th>
                <th className="th--sortable" onClick={() => doSort('anio')}>
                  Año <SortIcon col="anio" sort={sort} />
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {listPaginada.length === 0 && (
                <tr><td colSpan={6} style={{ color: 'var(--color-text-muted)' }}>Sin resultados.</td></tr>
              )}
              {listPaginada.map((v) => (
                <tr key={v.id}>
                  <td>{v.matricula}</td>
                  <td>
                    {v.en_viaje
                      ? <span className="badge badge--en_curso">En uso</span>
                      : <span className="badge badge--completado">Disponible</span>
                    }
                  </td>
                  <td>{v.marca}</td>
                  <td>{v.modelo}</td>
                  <td>{v.anio}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => abrirEditar(v)}>Editar</button>
                      <button className="btn btn--danger btn--sm" onClick={() => eliminar(v.id)}>Eliminar</button>
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
              <h3>{modal === 'nuevo' ? 'Nuevo vehículo' : 'Editar vehículo'}</h3>
              <button className="modal__close" onClick={cerrar}>✕</button>
            </div>
            {formError && <div className="alert alert--error">{formError}</div>}
            <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Matrícula</label>
                <input value={form.matricula} onChange={set('matricula')} required placeholder="1234ABC" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Marca</label>
                  <input value={form.marca} onChange={set('marca')} required placeholder="Volvo" />
                </div>
                <div className="form-group">
                  <label>Modelo</label>
                  <input value={form.modelo} onChange={set('modelo')} required placeholder="FH16" />
                </div>
              </div>
              <div className="form-group">
                <label>Año</label>
                <input type="number" value={form.anio} onChange={set('anio')} required min="1990" max="2030" />
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
