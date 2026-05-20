import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getParadas, createParada, updateParada, deleteParada } from '../../../services/paradas'
import Pagination from '../../../components/Pagination'
import api from '../../../services/api'
import Modal from '../../../components/Modal'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const PER_PAGE      = 10
const CENTRO_ESPANA = [40.416775, -3.703790]

function VolarA({ destino }) {
  const map = useMap()
  useEffect(() => {
    if (destino) map.flyTo(destino, 16, { duration: 1 })
  }, [destino, map])
  return null
}

function MapaSelector({ lat, lng, onChange }) {
  const [pos, setPos]           = useState(lat && lng ? [lat, lng] : null)
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [volar, setVolar]       = useState(null)
  const timeoutRef              = useRef(null)

  const buscar = async (q) => {
    setBusqueda(q)
    if (!q.trim()) { setResultados([]); return }
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      setBuscando(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=es`
        )
        const data = await res.json()
        setResultados(data)
      } catch {
        setResultados([])
      } finally {
        setBuscando(false)
      }
    }, 400)
  }

  const seleccionarResultado = (r) => {
    const coords = [parseFloat(r.lat), parseFloat(r.lon)]
    setPos(coords)
    onChange(coords[0], coords[1])
    setVolar(coords)
    setBusqueda(r.display_name.split(',').slice(0, 2).join(','))
    setResultados([])
  }

  function ClickHandler() {
    useMapEvents({
      click(e) {
        setPos([e.latlng.lat, e.latlng.lng])
        onChange(e.latlng.lat, e.latlng.lng)
        setResultados([])
      },
    })
    return null
  }

  return (
    <div>
      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Buscar ciudad, dirección, código postal…"
          value={busqueda}
          onChange={(e) => buscar(e.target.value)}
          style={{ width: '100%', paddingRight: buscando ? 32 : undefined }}
        />
        {buscando && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: 12 }}>
            …
          </span>
        )}
        {resultados.length > 0 && (
          <ul style={{
            position: 'absolute', zIndex: 1000, top: '100%', left: 0, right: 0,
            background: '#1e1e1e', border: '1px solid #333', borderRadius: 6,
            margin: 0, padding: 0, listStyle: 'none', maxHeight: 200, overflowY: 'auto',
          }}>
            {resultados.map((r) => (
              <li
                key={r.place_id}
                onClick={() => seleccionarResultado(r)}
                style={{
                  padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                  borderBottom: '1px solid #2a2a2a', color: '#ddd',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a2a'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {r.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Mapa */}
      <MapContainer
        center={pos ?? CENTRO_ESPANA}
        zoom={pos ? 14 : 6}
        style={{ height: 300, width: '100%', borderRadius: 8, cursor: 'crosshair' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <ClickHandler />
        <VolarA destino={volar} />
        {pos && <Marker position={pos} />}
      </MapContainer>

      {pos ? (
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
          Coordenadas: {pos[0].toFixed(6)}, {pos[1].toFixed(6)}
          <button
            type="button"
            onClick={() => { setPos(null); onChange(null, null) }}
            style={{ marginLeft: 10, fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Quitar
          </button>
        </p>
      ) : (
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
          Busca una ubicación o haz click directamente en el mapa.
        </p>
      )}
    </div>
  )
}

export default function Paradas() {
  const [paradas, setParadas]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [busqueda, setBusqueda]       = useState('')
  const [page, setPage]               = useState(1)
  const [modalNueva, setModalNueva]   = useState(false)
  const [modalEdit, setModalEdit]     = useState(null)
  const [modalImport, setModalImport] = useState(false)
  const [nombre, setNombre]           = useState('')
  const [coords, setCoords]           = useState({ lat: null, lng: null })
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
      await createParada({ nombre: nombre.trim(), lat: coords.lat, lng: coords.lng })
      setModalNueva(false)
      cargar()
    } catch (err) {
      const msgs = err.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al crear la parada.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updateParada(modalEdit.id, { nombre: nombre.trim(), lat: coords.lat, lng: coords.lng })
      setModalEdit(null)
      cargar()
    } catch (err) {
      const msgs = err.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const abrirEditar = (p) => {
    setNombre(p.nombre)
    setCoords({ lat: p.lat ?? null, lng: p.lng ?? null })
    setError(null)
    setModalEdit(p)
  }

  const abrirNueva = () => {
    setNombre('')
    setCoords({ lat: null, lng: null })
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
      const res = await api.post('/paradas/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
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

  const modalForm = (titulo, onSubmit) => (
    <Modal onClose={() => { setModalNueva(false); setModalEdit(null) }} maxWidth={620}>
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
            placeholder="Ej: Madrid - Mercamadrid"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Ubicación en el mapa</label>
          <MapaSelector
            lat={coords.lat}
            lng={coords.lng}
            onChange={(lat, lng) => setCoords({ lat, lng })}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost" onClick={() => { setModalNueva(false); setModalEdit(null) }}>Cancelar</button>
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
        <h2>Paradas</h2>
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
                  <th>Coordenadas</th>
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
                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {p.lat && p.lng
                        ? `${parseFloat(p.lat).toFixed(5)}, ${parseFloat(p.lng).toFixed(5)}`
                        : <span style={{ color: '#555' }}>Sin ubicación</span>
                      }
                    </td>
                    <td style={{ textAlign: 'right', width: 140 }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn--ghost btn--sm" onClick={() => abrirEditar(p)}>Editar</button>
                        <button className="btn btn--danger btn--sm" onClick={() => handleDelete(p.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} total={filtradas.length} perPage={PER_PAGE} onChange={setPage} />
          </div>
        )}
      </div>

      {modalNueva && modalForm('Nueva parada', handleAdd)}
      {modalEdit  && modalForm('Editar parada', handleEdit)}

      {modalImport && (
        <Modal onClose={() => setModalImport(false)} maxWidth={480}>
          <div className="modal__header">
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
