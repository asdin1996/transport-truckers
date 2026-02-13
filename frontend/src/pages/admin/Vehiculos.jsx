import { useEffect, useState } from 'react'
import { getVehiculos, createVehiculo, updateVehiculo, deleteVehiculo } from '../../services/vehiculos'

const EMPTY = { matricula: '', marca: '', modelo: '', anio: new Date().getFullYear() }

export default function Vehiculos() {
  const [lista, setLista] = useState([])
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
        <button className="btn btn--primary" onClick={abrirNuevo}>+ Nuevo vehículo</button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Año</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 && (
                <tr><td colSpan={5} style={{ color: 'var(--color-text-muted)' }}>Sin vehículos.</td></tr>
              )}
              {lista.map((v) => (
                <tr key={v.id}>
                  <td>{v.matricula}</td>
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
