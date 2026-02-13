import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCamioneros } from '../../services/camioneros'
import { getVehiculos } from '../../services/vehiculos'
import { getRutas } from '../../services/rutas'
import { createViaje } from '../../services/viajes'

export default function NuevoViaje() {
  const navigate = useNavigate()
  const [options, setOptions] = useState({ camioneros: [], vehiculos: [], rutas: [] })
  const [form, setForm] = useState({
    camionero_id: '',
    vehiculo_id: '',
    ruta_id: '',
    estado: 'pendiente',
    fecha_inicio: '',
    fecha_fin: '',
    notas: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getCamioneros(), getVehiculos(), getRutas()])
      .then(([cRes, vRes, rRes]) => {
        setOptions({
          camioneros: cRes.data.data ?? [],
          vehiculos:  vRes.data.data ?? [],
          rutas:      rRes.data.data ?? [],
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
      if (!payload.fecha_inicio) delete payload.fecha_inicio
      if (!payload.fecha_fin) delete payload.fecha_fin
      if (!payload.notas) delete payload.notas
      await createViaje(payload)
      navigate('/viajes')
    } catch (err) {
      const msgs = err.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al crear el viaje.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>← Volver</button>
          <h2>Asignar nuevo viaje</h2>
        </div>
      </div>

      <div className="card">
        {error && <div className="alert alert--error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            <select value={form.vehiculo_id} onChange={set('vehiculo_id')} required>
              <option value="">Seleccionar vehículo…</option>
              {options.vehiculos.map((v) => (
                <option key={v.id} value={v.id}>{v.matricula} — {v.marca} {v.modelo}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Ruta</label>
            <select value={form.ruta_id} onChange={set('ruta_id')} required>
              <option value="">Seleccionar ruta…</option>
              {options.rutas.map((r) => (
                <option key={r.id} value={r.id}>{r.origen} → {r.destino} ({r.km_estimados} km)</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Estado inicial</label>
            <select value={form.estado} onChange={set('estado')}>
              <option value="pendiente">Pendiente</option>
              <option value="en_curso">En curso</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha de inicio</label>
              <input type="date" value={form.fecha_inicio} onChange={set('fecha_inicio')} />
            </div>
            <div className="form-group">
              <label>Fecha de fin estimada</label>
              <input type="date" value={form.fecha_fin} onChange={set('fecha_fin')} />
            </div>
          </div>

          <div className="form-group">
            <label>Notas (opcional)</label>
            <textarea value={form.notas} onChange={set('notas')} placeholder="Instrucciones especiales…" />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>Cancelar</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Crear viaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
