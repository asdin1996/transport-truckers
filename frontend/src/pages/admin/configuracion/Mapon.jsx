import { useEffect, useState } from 'react'
import { getConfiguracion, setConfiguracion } from '../../../services/configuracion'
import api from '../../../services/api'

export default function Mapon() {
  const [apiKey, setApiKey]   = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState(null)

  const [syncVeh, setSyncVeh] = useState({ loading: false, result: null, error: null })
  const [syncCam, setSyncCam] = useState({ loading: false, result: null, error: null })
  const [primeraVez, setPrimeraVez] = useState(false)

  useEffect(() => {
    getConfiguracion('mapon_api_key')
      .then((res) => setApiKey(res.data.data?.valor ?? ''))
      .catch(() => setError('Error al cargar la configuración.'))
      .finally(() => setLoading(false))
  }, [])

  const handleGuardar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await setConfiguracion('mapon_api_key', apiKey)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Error al guardar la configuración.')
    } finally {
      setSaving(false)
    }
  }

  const handleSyncVehiculos = async () => {
    setSyncVeh({ loading: true, result: null, error: null })
    try {
      const res = await api.post('/mapon/sync/vehiculos', { limpiar: primeraVez })
      setSyncVeh({ loading: false, result: res.data.data, error: null })
      if (primeraVez) setPrimeraVez(false)
    } catch (err) {
      setSyncVeh({ loading: false, result: null, error: err?.response?.data?.message ?? 'Error al sincronizar.' })
    }
  }

  const handleSyncCamioneros = async () => {
    setSyncCam({ loading: true, result: null, error: null })
    try {
      const res = await api.post('/mapon/sync/camioneros')
      setSyncCam({ loading: false, result: res.data.data, error: null })
    } catch (err) {
      setSyncCam({ loading: false, result: null, error: err?.response?.data?.message ?? 'Error al sincronizar.' })
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Configuración Mapon</h2>
      </div>

      {/* API Key */}
      <div className="card" style={{ maxWidth: 560, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12, fontSize: 15 }}>API Key</h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
          Introduce la API key de Mapon para activar el mapa GPS en tiempo real.
        </p>

        {error && <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>}
        {saved && <div className="alert alert--success" style={{ marginBottom: 16 }}>Guardado correctamente.</div>}

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>
        ) : (
          <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Introduce tu API key de Mapon…"
                autoComplete="off"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Sincronización */}
      <div className="card" style={{ maxWidth: 560 }}>
        <h3 style={{ marginBottom: 4, fontSize: 15 }}>Sincronización de datos</h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
          Importa vehículos y conductores directamente desde Mapon.
        </p>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 20, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={primeraVez}
            onChange={(e) => setPrimeraVez(e.target.checked)}
          />
          Primera sincronización — limpia los vehículos existentes antes de importar
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Vehículos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btn--primary"
              onClick={handleSyncVehiculos}
              disabled={syncVeh.loading}
              style={{ minWidth: 180 }}
            >
              {syncVeh.loading ? 'Sincronizando…' : 'Sincronizar vehículos'}
            </button>
            {syncVeh.result && (
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                {syncVeh.result.created} creados · {syncVeh.result.updated} actualizados · {syncVeh.result.skipped} omitidos
              </span>
            )}
            {syncVeh.error && (
              <span style={{ fontSize: 13, color: '#ef4444' }}>{syncVeh.error}</span>
            )}
          </div>

          {/* Camioneros */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btn--primary"
              onClick={handleSyncCamioneros}
              disabled={syncCam.loading}
              style={{ minWidth: 180 }}
            >
              {syncCam.loading ? 'Sincronizando…' : 'Sincronizar camioneros'}
            </button>
            {syncCam.result && (
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                {syncCam.result.created} creados · {syncCam.result.updated} actualizados · {syncCam.result.skipped} omitidos
              </span>
            )}
            {syncCam.error && (
              <span style={{ fontSize: 13, color: '#ef4444' }}>{syncCam.error}</span>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
