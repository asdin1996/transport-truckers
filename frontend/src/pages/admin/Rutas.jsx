import { useEffect, useState } from 'react'
import { getRutas, createRuta, updateRuta, deleteRuta } from '../../services/rutas'
import Pagination from '../../components/Pagination'

const PER_PAGE = 10
const EMPTY = { origen: '', destino: '', km_estimados: '', paradas: '' }

export default function Rutas() {
  const [lista, setLista]       = useState([])
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [modal, setModal]       = useState(null) // null | 'nuevo' | ruta-obj
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [formError, setFormError] = useState(null)

  const cargar = () =>
    getRutas()
      .then((r) => setLista(r.data.data ?? []))
      .catch(() => setError('Error al cargar rutas.'))
      .finally(() => setLoading(false))

  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => {
    setForm(EMPTY)
    setFormError(null)
    setModal('nuevo')
  }

  const abrirEditar = (r) => {
    setForm({
      origen:        r.origen ?? '',
      destino:       r.destino ?? '',
      km_estimados:  r.km_estimados ?? '',
      paradas:       Array.isArray(r.paradas) ? r.paradas.join(', ') : '',
    })
    setFormError(null)
    setModal(r)
  }

  const cerrar = () => setModal(null)
  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }))

  const guardar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        origen:       form.origen,
        destino:      form.destino,
        km_estimados: form.km_estimados ? parseInt(form.km_estimados) : null,
        paradas:      form.paradas
          ? form.paradas.split(',').map((p) => p.trim()).filter(Boolean)
          : [],
      }
      if (modal === 'nuevo') {
        await createRuta(payload)
      } else {
        await updateRuta(modal.id, payload)
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
    if (!confirm('¿Eliminar esta ruta?')) return
    try {
      await deleteRuta(id)
      setLista((prev) => prev.filter((r) => r.id !== id))
    } catch {
      setError('No se pudo eliminar la ruta.')
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>

  const paginated = lista.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div>
      <div className="page-header">
        <h2>Rutas</h2>
        <button className="btn btn--primary" onClick={abrirNuevo}>+ Nueva ruta</button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Origen</th>
                <th>Destino</th>
                <th>Km estimados</th>
                <th>Paradas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={5} style={{ color: 'var(--color-text-muted)' }}>Sin rutas.</td></tr>
              )}
              {paginated.map((r) => (
                <tr key={r.id}>
                  <td>{r.origen}</td>
                  <td>{r.destino}</td>
                  <td>{r.km_estimados ? `${r.km_estimados} km` : '—'}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                    {Array.isArray(r.paradas) && r.paradas.length > 0
                      ? r.paradas.join(' · ')
                      : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => abrirEditar(r)}>Editar</button>
                      <button className="btn btn--danger btn--sm" onClick={() => eliminar(r.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={lista.length} perPage={PER_PAGE} onChange={setPage} />
      </div>

      {modal && (
        <div className="modal-overlay" onClick={cerrar}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{modal === 'nuevo' ? 'Nueva ruta' : 'Editar ruta'}</h3>
              <button className="modal__close" onClick={cerrar}>✕</button>
            </div>

            {formError && <div className="alert alert--error">{formError}</div>}

            <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Origen</label>
                  <input value={form.origen} onChange={set('origen')} required placeholder="Madrid" />
                </div>
                <div className="form-group">
                  <label>Destino</label>
                  <input value={form.destino} onChange={set('destino')} required placeholder="Barcelona" />
                </div>
              </div>

              <div className="form-group">
                <label>Km estimados</label>
                <input
                  type="number"
                  value={form.km_estimados}
                  onChange={set('km_estimados')}
                  min="1"
                  placeholder="620"
                />
              </div>

              <div className="form-group">
                <label>Paradas <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(separadas por coma)</span></label>
                <input
                  value={form.paradas}
                  onChange={set('paradas')}
                  placeholder="Zaragoza, Lleida"
                />
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
