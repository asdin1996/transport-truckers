import { useEffect, useState } from 'react'
import { getCamioneros, createCamionero, updateCamionero, deleteCamionero } from '../../services/camioneros'
import Pagination from '../../components/Pagination'

const PER_PAGE = 10

const EMPTY = { nombre: '', apellidos: '', email: '', telefono: '', licencia: '', fecha_nacimiento: '' }

export default function Camioneros() {
  const [lista, setLista] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null) // null | 'nuevo' | camionero-obj
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const cargar = () =>
    getCamioneros()
      .then((r) => setLista(r.data.data ?? []))
      .catch(() => setError('Error al cargar camioneros.'))
      .finally(() => setLoading(false))

  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => { setForm(EMPTY); setFormError(null); setModal('nuevo') }
  const abrirEditar = (c) => {
    setForm({
      nombre: c.nombre,
      apellidos: c.apellidos,
      email: c.email,
      telefono: c.telefono ?? '',
      licencia: c.licencia,
      fecha_nacimiento: c.fecha_nacimiento ?? '',
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

  const enViaje  = lista.filter((c) => c.en_viaje)
  const libres   = lista.filter((c) => !c.en_viaje)
  const filtrada = filtro === 'en_viaje' ? enViaje : filtro === 'libres' ? libres : lista
  const listFiltrada = filtrada.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div>
      <div className="page-header">
        <h2>Camioneros</h2>
        <button className="btn btn--primary" onClick={abrirNuevo}>+ Nuevo camionero</button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="filter-tabs">
        <button className={`filter-tab${filtro === 'todos' ? ' active' : ''}`} onClick={() => { setFiltro('todos'); setPage(1) }}>
          Todos ({lista.length})
        </button>
        <button className={`filter-tab${filtro === 'libres' ? ' active' : ''}`} onClick={() => { setFiltro('libres'); setPage(1) }}>
          Libres ({libres.length})
        </button>
        <button className={`filter-tab${filtro === 'en_viaje' ? ' active' : ''}`} onClick={() => { setFiltro('en_viaje'); setPage(1) }}>
          En viaje ({enViaje.length})
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Licencia</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {listFiltrada.length === 0 && (
                <tr><td colSpan={6} style={{ color: 'var(--color-text-muted)' }}>Sin camioneros.</td></tr>
              )}
              {listFiltrada.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombre} {c.apellidos}</td>
                  <td>
                    {c.en_viaje
                      ? <span className="badge badge--en_curso">En viaje</span>
                      : <span className="badge badge--completado">Libre</span>
                    }
                  </td>
                  <td>{c.email}</td>
                  <td>{c.telefono ?? '—'}</td>
                  <td>{c.licencia}</td>
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
        <Pagination page={page} total={filtrada.length} perPage={PER_PAGE} onChange={setPage} />
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
                  <label>Licencia</label>
                  <input value={form.licencia} onChange={set('licencia')} required />
                </div>
              </div>
              <div className="form-group">
                <label>Fecha de nacimiento</label>
                <input type="date" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} />
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
