import { useEffect, useRef, useState } from 'react'
import {
  getTiposMaterial,
  createTipoMaterial,
  updateTipoMaterial,
  deleteTipoMaterial,
  importTiposMaterial,
} from '../../../services/tiposMaterial'
import Pagination from '../../../components/Pagination'
import Modal from '../../../components/Modal'

const PER_PAGE = 10

export default function TiposMaterial() {
  const [tipos, setTipos]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [busqueda, setBusqueda]       = useState('')
  const [page, setPage]               = useState(1)
  const [modalNueva, setModalNueva]   = useState(false)
  const [modalEdit, setModalEdit]     = useState(null)
  const [modalImport, setModalImport] = useState(false)
  const [nombre, setNombre]           = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState(null)
  const [file, setFile]               = useState(null)
  const [importing, setImporting]     = useState(false)
  const [importMsg, setImportMsg]     = useState(null)
  const [importError, setImportError] = useState(null)
  const fileInputRef = useRef(null)

  const cargar = () =>
    getTiposMaterial()
      .then((res) => setTipos(res.data.data ?? []))
      .catch(() => setError('Error al cargar los tipos de material.'))
      .finally(() => setLoading(false))

  useEffect(() => { cargar() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createTipoMaterial({ nombre: nombre.trim() })
      setModalNueva(false)
      setNombre('')
      cargar()
    } catch (err) {
      const msgs = err.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al crear el tipo de material.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updateTipoMaterial(modalEdit.id, { nombre: nombre.trim() })
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

  const abrirEditar = (t) => {
    setNombre(t.nombre)
    setError(null)
    setModalEdit(t)
  }

  const abrirNueva = () => {
    setNombre('')
    setError(null)
    setModalNueva(true)
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setImportMsg(null)
    setImportError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await importTiposMaterial(fd)
      setImportMsg(res.data.message)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      cargar()
    } catch (err) {
      const msgs = err.response?.data?.errors
      setImportError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al importar el fichero.')
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este tipo de material?')) return
    try {
      await deleteTipoMaterial(id)
      setTipos((prev) => prev.filter((t) => t.id !== id))
    } catch {
      setError('Error al eliminar.')
    }
  }

  const filtrados = tipos.filter((t) =>
    t.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )
  const doSearch = (q) => { setBusqueda(q); setPage(1) }
  const lista = filtrados.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const modalForm = (titulo, onSubmit) => (
    <Modal onClose={() => { setModalNueva(false); setModalEdit(null) }} maxWidth={440}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>{titulo}</h3>
        <button className="btn btn--ghost btn--sm" onClick={() => { setModalNueva(false); setModalEdit(null) }}>✕</button>
      </div>

      {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            placeholder="Ej: Palets, Granel, Frigorífico…"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost" onClick={() => { setModalNueva(false); setModalEdit(null) }}>
            Cancelar
          </button>
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
        <h2>Tipos de material</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn--ghost"
            onClick={() => { setModalImport(true); setImportMsg(null); setImportError(null) }}
            style={{ fontSize: 15, padding: '10px 24px', fontWeight: 600 }}
          >
            ⬆ Importar
          </button>
          <button
            className="btn btn--primary"
            onClick={abrirNueva}
            style={{ fontSize: 15, padding: '10px 24px', fontWeight: 600 }}
          >
            + Nuevo
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-controls">
          <div className="table-search">
            <span className="table-search__icon">⌕</span>
            <input
              type="text"
              placeholder="Buscar tipo de material…"
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
            {busqueda ? 'Sin resultados para esa búsqueda.' : 'Sin tipos de material registrados.'}
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
                {lista.map((t, i) => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12, width: 40 }}>
                      {(page - 1) * PER_PAGE + i + 1}
                    </td>
                    <td>{t.nombre}</td>
                    <td style={{ textAlign: 'right', width: 140 }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn--ghost btn--sm" onClick={() => abrirEditar(t)}>Editar</button>
                        <button className="btn btn--danger btn--sm" onClick={() => handleDelete(t.id)}>Eliminar</button>
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

      {modalNueva && modalForm('Nuevo tipo de material', handleAdd)}
      {modalEdit  && modalForm('Editar tipo de material', handleEdit)}

      {modalImport && (
        <Modal onClose={() => setModalImport(false)} maxWidth={480}>
          <div className="modal__header">
            <h3 style={{ margin: 0 }}>Importar tipos de material</h3>
            <button className="btn btn--ghost btn--sm" onClick={() => setModalImport(false)}>✕</button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Columna requerida: <strong>Nombre</strong>.<br />
            Los duplicados se omiten automáticamente.<br />
            Formatos: <strong>.xlsx · .xls · .csv</strong>
          </p>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Seleccionar fichero</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => { setFile(e.target.files[0] ?? null); setImportMsg(null); setImportError(null) }}
            />
          </div>
          {importMsg   && <p style={{ fontSize: 13, color: '#66bb6a', marginBottom: 12 }}>{importMsg}</p>}
          {importError && <p style={{ fontSize: 13, color: 'var(--color-primary)', marginBottom: 12 }}>{importError}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn--ghost" onClick={() => setModalImport(false)}>Cerrar</button>
            <button className="btn btn--primary" onClick={handleImport} disabled={importing || !file}>
              {importing ? 'Importando…' : 'Importar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
