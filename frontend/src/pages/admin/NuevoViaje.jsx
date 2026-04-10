import { useEffect, useState } from 'react'
import { getCamioneros } from '../../services/camioneros'
import { getVehiculos } from '../../services/vehiculos'
import { getParadas } from '../../services/paradas'
import { createViaje } from '../../services/viajes'

function now() {
  return new Date().toISOString().slice(0, 16)
}

export default function NuevoViaje({ onClose, onCreated }) {
  const [options, setOptions] = useState({ camioneros: [], vehiculos: [], paradas: [] })
  const [form, setForm] = useState({
    camionero_id: '',
    vehiculo_id:  '',
    tipo:         'carga',
    origen:       '',
    destino:      '',
    estado:       'pendiente',
    fecha_inicio: now(),
    fecha_fin:    now(),
    notas:        '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    Promise.all([getCamioneros(), getVehiculos(), getParadas()])
      .then(([cRes, vRes, pRes]) => {
        setOptions({
          camioneros: cRes.data.data ?? [],
          vehiculos:  vRes.data.data ?? [],
          paradas:    pRes.data.data ?? [],
        })
      })
      .catch(() => setError('Error al cargar los datos.'))
      .finally(() => setLoading(false))
  }, [])

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = { ...form }
      if (!payload.notas) delete payload.notas
      await createViaje(payload)
      onCreated?.()
      onClose()
    } catch (err) {
      const msgs = err.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al crear el viaje.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 8,
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>Nuevo viaje</h3>
          <button className="btn btn--ghost btn--sm" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>
        ) : (
          <>
            {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo</label>
                  <select value={form.tipo} onChange={set('tipo')}>
                    <option value="carga">Carga</option>
                    <option value="descarga">Descarga</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select value={form.estado} onChange={set('estado')}>
                    <option value="pendiente">Pendiente</option>
                    <option value="en_curso">En curso</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Origen</label>
                  <input
                    list="paradas-origen"
                    value={form.origen}
                    onChange={set('origen')}
                    placeholder="Seleccionar o escribir…"
                  />
                  <datalist id="paradas-origen">
                    {options.paradas.map((p) => <option key={p.id} value={p.nombre} />)}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>Destino</label>
                  <input
                    list="paradas-destino"
                    value={form.destino}
                    onChange={set('destino')}
                    placeholder="Seleccionar o escribir…"
                  />
                  <datalist id="paradas-destino">
                    {options.paradas.map((p) => <option key={p.id} value={p.nombre} />)}
                  </datalist>
                </div>
              </div>

              <div className="form-group">
                <label>Camionero</label>
                <select value={form.camionero_id} onChange={set('camionero_id')} required>
                  <option value="">Seleccionar camionero…</option>
                  {options.camioneros.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.apellidos}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Vehículo</label>
                <select value={form.vehiculo_id} onChange={set('vehiculo_id')}>
                  <option value="">Sin vehículo asignado</option>
                  {options.vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>{v.matricula} — {v.marca} {v.modelo}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha y hora inicio</label>
                  <input type="datetime-local" value={form.fecha_inicio} onChange={set('fecha_inicio')} />
                </div>
                <div className="form-group">
                  <label>Fecha y hora fin estimada</label>
                  <input type="datetime-local" value={form.fecha_fin} onChange={set('fecha_fin')} />
                </div>
              </div>

              <div className="form-group">
                <label>Notas (opcional)</label>
                <textarea value={form.notas} onChange={set('notas')} placeholder="Instrucciones especiales…" rows={3} />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Guardando…' : 'Crear viaje'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
