import { useEffect, useRef, useState } from 'react'
import { getParadas, createParada, deleteParada } from '../../../services/paradas'
import api from '../../../services/api'

export default function Paradas() {
  const [paradas, setParadas]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [nombre, setNombre]         = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState(null)
  const [file, setFile]             = useState(null)
  const [importing, setImporting]   = useState(false)
  const [importMsg, setImportMsg]   = useState(null)
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

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h2>Paradas</h2>
      </div>

      {error && <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Añadir una parada */}
      <div className="card" style={{ marginBottom: 20 }}>
        <p className="card__title">Añadir parada</p>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            placeholder="Nombre de la parada…"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn--primary" disabled={saving || !nombre.trim()}>
            {saving ? 'Guardando…' : 'Añadir'}
          </button>
        </form>
      </div>

      {/* Importar desde Excel */}
      <div className="card" style={{ marginBottom: 20 }}>
        <p className="card__title">Importar desde Excel</p>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
          El fichero debe tener una columna llamada <strong>Nombre</strong>. Se omiten duplicados.
          Formatos admitidos: <strong>.xlsx, .xls, .csv</strong>
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => { setFile(e.target.files[0] ?? null); setImportMsg(null); setImportError(null) }}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button
            className="btn btn--primary"
            onClick={handleImport}
            disabled={importing || !file}
          >
            {importing ? 'Importando…' : 'Importar'}
          </button>
        </div>
        {importMsg   && <p style={{ fontSize: 13, color: '#66bb6a', marginTop: 8 }}>{importMsg}</p>}
        {importError && <p style={{ fontSize: 13, color: 'var(--color-primary)', marginTop: 8 }}>{importError}</p>}
      </div>

      {/* Listado */}
      <div className="card">
        <p className="card__title">Paradas registradas ({paradas.length})</p>
        {loading ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando…</p>
        ) : paradas.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Sin paradas registradas.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paradas.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn--danger btn--sm" onClick={() => handleDelete(p.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
