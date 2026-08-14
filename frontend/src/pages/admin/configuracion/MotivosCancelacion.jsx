import { useEffect, useState } from 'react'
import {
  getMotivosCancelacion,
  createMotivoCancelacion,
  updateMotivoCancelacion,
  deleteMotivoCancelacion,
} from '../../../services/motivosCancelacion'
import Pagination from '../../../components/Pagination'
import Modal from '../../../components/Modal'

const PER_PAGE = 10

export default function MotivosCancelacion() {
  const [motivos, setMotivos]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [busqueda, setBusqueda]       = useState('')
  const [page, setPage]               = useState(1)
  const [modalNueva, setModalNueva]   = useState(false)
  const [modalEdit, setModalEdit]     = useState(null)
  const [nombre, setNombre]           = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState(null)

  const cargar = () =>
    getMotivosCancelacion()
      .then((res) => setMotivos(res.data.data ?? []))
      .catch(() => setError('Error al cargar los motivos de cancelación.'))
      .finally(() => setLoading(false))

  useEffect(() => { cargar() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createMotivoCancelacion({ nombre: nombre.trim() })
      setModalNueva(false)
      setNombre('')
      cargar()
    } catch (err) {
      const msgs = err.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al crear el motivo.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updateMotivoCancelacion(modalEdit.id, { nombre: nombre.trim() })
      setModalEdit(null)
      setNombre('')
      cargar()
    } catch (err) {
      const msgs = err.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const abrirEditar = (m) => {
    setNombre(m.nombre)
    setError(null)
    setModalEdit(m)
  }

  const abrirNueva = () => {
    setNombre('')
    setError(null)
    setModalNueva(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este motivo de cancelación?')) return
    try {
      await deleteMotivoCancelacion(id)
      setMotivos((prev) => prev.filter((m) => m.id !== id))
    } catch {
      setError('Error al eliminar.')
    }
  }

  const cerrarModal = () => { setModalNueva(false); setModalEdit(null) }

  const filtrados = motivos.filter((m) =>
    m.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )
  const doSearch = (q) => { setBusqueda(q); setPage(1) }
  const lista = filtrados.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const modalForm = (titulo, onSubmit) => (
    <Modal onClose={cerrarModal} maxWidth={440}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>{titulo}</h3>
        <button className="btn btn--ghost btn--sm" onClick={cerrarModal}>✕</button>
      </div>

      {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            placeholder="Ej: Pedido cancelado, Error en creación…"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost" onClick={cerrarModal}>Cancelar</button>
          <button type="submit" className="btn btn--primary" disabled={saving || !nombre.trim()}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )

  return (
    <div>
      <div className="page-header">
        <h2>Motivos de cancelación</h2>
        <button
          className="btn btn--primary"
          onClick={abrirNueva}
          style={{ fontSize: 15, padding: '10px 24px', fontWeight: 600 }}
        >
          + Nuevo
        </button>
      </div>

      <div className="card">
        <div className="table-controls">
          <div className="table-search">
            <span className="table-search__icon">⌕</span>
            <input
              type="text"
              placeholder="Buscar motivo…"
              value={busqueda}
              onChange={(e) => doSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando…</p>
        ) : filtrados.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: '8px 0' }}>
            {busqueda ? 'Sin resultados para esa búsqueda.' : 'Sin motivos de cancelación registrados.'}
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((m, i) => (
                  <tr key={m.id}>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12, width: 40 }}>
                      {(page - 1) * PER_PAGE + i + 1}
                    </td>
                    <td>{m.nombre}</td>
                    <td style={{ textAlign: 'right', width: 140 }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn--ghost btn--sm" onClick={() => abrirEditar(m)}>Editar</button>
                        <button className="btn btn--danger btn--sm" onClick={() => handleDelete(m.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} total={filtrados.length} perPage={PER_PAGE} onChange={setPage} />
          </div>
        )}
      </div>

      {modalNueva && modalForm('Nuevo motivo de cancelación', handleAdd)}
      {modalEdit  && modalForm('Editar motivo de cancelación', handleEdit)}
    </div>
  )
}
