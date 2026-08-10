import { useEffect, useState } from 'react'
import { getAlmacenes, createAlmacen, updateAlmacen, deleteAlmacen } from '../../../services/almacenes'
import Pagination from '../../../components/Pagination'
import Modal from '../../../components/Modal'

const PER_PAGE = 10

export default function Almacenes() {
  const [almacenes, setAlmacenes]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [busqueda, setBusqueda]         = useState('')
  const [page, setPage]                 = useState(1)
  const [modalNuevo, setModalNuevo]     = useState(false)
  const [modalEdit, setModalEdit]       = useState(null)
  const [nombre, setNombre]             = useState('')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState(null)

  const cargar = () =>
    getAlmacenes()
      .then((res) => setAlmacenes(res.data.data ?? []))
      .catch(() => setError('Error al cargar los almacenes.'))
      .finally(() => setLoading(false))

  useEffect(() => { cargar() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    setSaving(true); setError(null)
    try {
      await createAlmacen({ nombre: nombre.trim() })
      setModalNuevo(false); setNombre(''); cargar()
    } catch (err) {
      const msgs = err.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al crear el almacén.')
    } finally { setSaving(false) }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await updateAlmacen(modalEdit.id, { nombre: nombre.trim() })
      setModalEdit(null); setNombre(''); cargar()
    } catch (err) {
      const msgs = err.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al guardar.')
    } finally { setSaving(false) }
  }

  const abrirEditar = (a) => { setNombre(a.nombre); setError(null); setModalEdit(a) }
  const abrirNuevo  = ()  => { setNombre(''); setError(null); setModalNuevo(true) }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este almacén? Los camioneros asignados quedarán sin almacén.')) return
    try {
      await deleteAlmacen(id)
      setAlmacenes((prev) => prev.filter((a) => a.id !== id))
    } catch { setError('Error al eliminar.') }
  }

  const filtrados = almacenes.filter((a) =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )
  const doSearch = (q) => { setBusqueda(q); setPage(1) }
  const lista = filtrados.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const modalForm = (titulo, onSubmit) => (
    <Modal onClose={() => { setModalNuevo(false); setModalEdit(null) }} maxWidth={440}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>{titulo}</h3>
        <button className="btn btn--ghost btn--sm" onClick={() => { setModalNuevo(false); setModalEdit(null) }}>✕</button>
      </div>
      {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label>Nombre del almacén</label>
          <input
            type="text"
            placeholder="Ej: Almacén Madrid, Nave Valencia…"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost" onClick={() => { setModalNuevo(false); setModalEdit(null) }}>Cancelar</button>
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
        <h2>Almacenes</h2>
        <button className="btn btn--primary" onClick={abrirNuevo} style={{ fontSize: 15, padding: '10px 24px', fontWeight: 600 }}>
          + Nuevo
        </button>
      </div>

      <div className="card">
        <div className="table-controls">
          <div className="table-search">
            <span className="table-search__icon">⌕</span>
            <input type="text" placeholder="Buscar almacén…" value={busqueda} onChange={(e) => doSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando…</p>
        ) : filtrados.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: '8px 0' }}>
            {busqueda ? 'Sin resultados.' : 'Sin almacenes registrados.'}
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
                {lista.map((a, i) => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12, width: 40 }}>
                      {(page - 1) * PER_PAGE + i + 1}
                    </td>
                    <td>{a.nombre}</td>
                    <td style={{ textAlign: 'right', width: 140 }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn--ghost btn--sm" onClick={() => abrirEditar(a)}>Editar</button>
                        <button className="btn btn--danger btn--sm" onClick={() => handleDelete(a.id)}>Eliminar</button>
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

      {modalNuevo && modalForm('Nuevo almacén', handleAdd)}
      {modalEdit  && modalForm('Editar almacén', handleEdit)}
    </div>
  )
}
