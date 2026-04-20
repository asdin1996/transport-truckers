import { useEffect, useRef, useState } from 'react'
import { getParadas, createParada, deleteParada } from '../../../services/paradas'
import Pagination from '../../../components/Pagination'
import api from '../../../services/api'

const PER_PAGE = 10

export default function Paradas() {
  const [paradas, setParadas]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [busqueda, setBusqueda]       = useState('')
  const [page, setPage]               = useState(1)
  const [modalNueva, setModalNueva]   = useState(false)
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
    getParadas()
      .then((res) => setParadas(res.data.data ?? []))
      .catch(() => setError('Error al cargar paradas.'))
      .finally(() => setLoading(false))

  useEffect(() => { cargar() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createParada({ nombre: nombre.trim() })
      setNombre('')
      setModalNueva(false)
      cargar()
    } catch (err) {
      const msgs = err.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al crear la parada.')
    } finally {
      setSaving(false)
    }
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setImportMsg(null)
    setImportError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post('/paradas/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
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
    if (!confirm('¿Eliminar esta parada?')) return
    try {
      await deleteParada(id)
      setParadas((prev) => prev.filter((p) => p.id !== id))
    } catch {
      setError('Error al eliminar.')
    }
  }

  const filtradas = paradas.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const doSearch = (q) => { setBusqueda(q); setPage(1) }
  const lista = filtradas.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div>
      <div className="page-header">
        <h2>Paradas</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => { setModalImport(true); setImportMsg(null); setImportError(null) }}
          >
            ⬆ Importar
          </button>
          <button
            className="btn btn--primary btn--sm"
            onClick={() => { setModalNueva(true); setNombre(''); setError(null) }}
          >
            + Nueva
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-controls">
          <div className="table-search">
            <span className="table-search__icon">⌕</span>
            <input
              type="text"
              placeholder="Buscar parada…"
              value={busqueda}
              onChange={(e) => doSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {filtradas.length} resultado{filtradas.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando…</p>
        ) : filtradas.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: '8px 0' }}>
            {busqueda ? 'Sin resultados para esa búsqueda.' : 'Sin paradas registradas.'}
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
                {lista.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12, width: 40 }}>
                      {(page - 1) * PER_PAGE + i + 1}
                    </td>
                    <td>{p.nombre}</td>
                    <td style={{ textAlign: 'right', width: 90 }}>
                      <button className="btn btn--danger btn--sm" onClick={() => handleDelete(p.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} total={filtradas.length} perPage={PER_PAGE} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Modal — Nueva parada */}
      {modalNueva && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setModalNueva(false)}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 8,
              width: '100%',
              maxWidth: 440,
              padding: 24,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Nueva parada</h3>
              <button className="btn btn--ghost btn--sm" onClick={() => setModalNueva(false)}>✕</button>
            </div>

            {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  placeholder="Ej: Madrid - Mercamadrid"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setModalNueva(false)}>Cancelar</button>
                <button type="submit" className="btn btn--primary" disabled={saving || !nombre.trim()}>
                  {saving ? 'Guardando…' : 'Crear parada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal — Importar Excel */}
      {modalImport && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setModalImport(false)}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 8,
              width: '100%',
              maxWidth: 480,
              padding: 24,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Importar paradas</h3>
              <button className="btn btn--ghost btn--sm" onClick={() => setModalImport(false)}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              El fichero debe contener una columna con cabecera <strong>Nombre</strong>.<br />
              Los duplicados se omiten automáticamente.<br />
              Formatos: <strong>.xlsx · .xls · .csv</strong>
            </p>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Seleccionar fichero</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  setFile(e.target.files[0] ?? null)
                  setImportMsg(null)
                  setImportError(null)
                }}
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
          </div>
        </div>
      )}
    </div>
  )
}
