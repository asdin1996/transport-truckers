import { useEffect, useRef, useState } from 'react'
import { getParadas, createParada, importParadas, deleteParada } from '../../../services/paradas'

export default function Paradas() {
  const [paradas, setParadas]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [nombre, setNombre]       = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState(null)
  const inputRef = useRef(null)

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

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta parada?')) return
    try {
      await deleteParada(id)
      setParadas((prev) => prev.filter((p) => p.id !== id))
    } catch {
      setError('Error al eliminar.')
    }
  }

  const handleImport = async () => {
    const lineas = importText.split('\n').map((l) => l.trim()).filter(Boolean)
    if (!lineas.length) return
    setImporting(true)
    setImportMsg(null)
    try {
      const res = await importParadas(lineas)
      setImportMsg(res.data.message)
      setImportText('')
      cargar()
    } catch {
      setImportMsg('Error al importar.')
    } finally {
      setImporting(false)
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
            ref={inputRef}
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

      {/* Importar en bloque */}
      <div className="card" style={{ marginBottom: 20 }}>
        <p className="card__title">Importar paradas</p>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>
          Una parada por línea.
        </p>
        <textarea
          rows={5}
          placeholder={'Madrid - Mercamadrid\nBarcelona - Zona Franca\nValencia - Puerto'}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          style={{ width: '100%', marginBottom: 10, boxSizing: 'border-box' }}
        />
        {importMsg && (
          <p style={{ fontSize: 13, color: 'var(--color-primary)', marginBottom: 8 }}>{importMsg}</p>
        )}
        <button
          className="btn btn--primary"
          onClick={handleImport}
          disabled={importing || !importText.trim()}
        >
          {importing ? 'Importando…' : 'Importar'}
        </button>
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
                      <button
                        className="btn btn--danger btn--sm"
                        onClick={() => handleDelete(p.id)}
                      >
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
