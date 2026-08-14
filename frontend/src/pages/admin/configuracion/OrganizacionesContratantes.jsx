import { useEffect, useState } from 'react'
import {
  getOrganizacionesContratantes,
  createOrganizacionContratante,
  updateOrganizacionContratante,
  deleteOrganizacionContratante,
} from '../../../services/organizacionesContratantes'
import Pagination from '../../../components/Pagination'
import Modal from '../../../components/Modal'

const PER_PAGE = 10

export default function OrganizacionesContratantes() {
  const [orgs, setOrgs]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [busqueda, setBusqueda]     = useState('')
  const [page, setPage]             = useState(1)
  const [modalNueva, setModalNueva] = useState(false)
  const [modalEdit, setModalEdit]   = useState(null)
  const [nombre, setNombre]         = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState(null)

  const cargar = () =>
    getOrganizacionesContratantes()
      .then((res) => setOrgs(res.data.data ?? []))
      .catch(() => setError('Error al cargar las organizaciones contratantes.'))
      .finally(() => setLoading(false))

  useEffect(() => { cargar() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createOrganizacionContratante({ nombre: nombre.trim() })
      setModalNueva(false)
      setNombre('')
      cargar()
    } catch (err) {
      const msgs = err.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al crear la organización.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updateOrganizacionContratante(modalEdit.id, { nombre: nombre.trim() })
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

  const abrirEditar = (org) => {
    setNombre(org.nombre)
    setError(null)
    setModalEdit(org)
  }

  const abrirNueva = () => {
    setNombre('')
    setError(null)
    setModalNueva(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta organización contratante?')) return
    try {
      await deleteOrganizacionContratante(id)
      setOrgs((prev) => prev.filter((o) => o.id !== id))
    } catch {
      setError('Error al eliminar.')
    }
  }

  const cerrarModal = () => { setModalNueva(false); setModalEdit(null) }

  const filtrados = orgs.filter((o) =>
    o.nombre.toLowerCase().includes(busqueda.toLowerCase())
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
            placeholder="Ej: DLG, C74, C4I…"
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
        <h2>Organizaciones contratantes</h2>
        <button
          className="btn btn--primary"
          onClick={abrirNueva}
          style={{ fontSize: 15, padding: '10px 24px', fontWeight: 600 }}
        >
          + Nueva
        </button>
      </div>

      <div className="card">
        <div className="table-controls">
          <div className="table-search">
            <span className="table-search__icon">⌕</span>
            <input
              type="text"
              placeholder="Buscar organización…"
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
            {busqueda ? 'Sin resultados para esa búsqueda.' : 'Sin organizaciones contratantes registradas.'}
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
                {lista.map((o, i) => (
                  <tr key={o.id}>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12, width: 40 }}>
                      {(page - 1) * PER_PAGE + i + 1}
                    </td>
                    <td>{o.nombre}</td>
                    <td style={{ textAlign: 'right', width: 140 }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn--ghost btn--sm" onClick={() => abrirEditar(o)}>Editar</button>
                        <button className="btn btn--danger btn--sm" onClick={() => handleDelete(o.id)}>Eliminar</button>
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

      {modalNueva && modalForm('Nueva organización contratante', handleAdd)}
      {modalEdit  && modalForm('Editar organización contratante', handleEdit)}
    </div>
  )
}
