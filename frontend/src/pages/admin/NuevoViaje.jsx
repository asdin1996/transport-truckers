import { useEffect, useState } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale/es'
import 'react-datepicker/dist/react-datepicker.css'
import { getCamioneros } from '../../services/camioneros'
import { getVehiculos } from '../../services/vehiculos'
import { getParadas } from '../../services/paradas'
import { getTiposMaterial } from '../../services/tiposMaterial'
import { createViaje } from '../../services/viajes'
import Combobox from '../../components/Combobox'
import Modal from '../../components/Modal'

registerLocale('es', es)

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      color: 'var(--color-text-muted)',
      margin: '6px 0 -2px',
    }}>
      {children}
    </p>
  )
}

export default function NuevoViaje({ onClose, onCreated }) {
  const [options, setOptions] = useState({ camioneros: [], vehiculos: [], paradas: [], tiposMaterial: [] })
  const [form, setForm] = useState({
    camionero_id:     '',
    vehiculo_id:      '',
    tipo:             'carga',
    tipo_material_id: '',
    origen:           '',
    destino:          '',
    estado:           'pendiente',
    fecha_inicio:     new Date(),
    notas:            '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    Promise.all([getCamioneros(), getVehiculos(), getParadas(), getTiposMaterial()])
      .then(([cRes, vRes, pRes, tmRes]) => {
        setOptions({
          camioneros:    cRes.data.data  ?? [],
          vehiculos:     vRes.data.data  ?? [],
          paradas:       pRes.data.data  ?? [],
          tiposMaterial: tmRes.data.data ?? [],
        })
      })
      .catch(() => setError('Error al cargar los datos.'))
      .finally(() => setLoading(false))
  }, [])

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }))
  const setVal = (f) => (val) => setForm((prev) => ({ ...prev, [f]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = { ...form }
      if (payload.fecha_inicio instanceof Date)
        payload.fecha_inicio = payload.fecha_inicio.toISOString().slice(0, 10)
      if (!payload.camionero_id)     delete payload.camionero_id
      if (!payload.vehiculo_id)      delete payload.vehiculo_id
      if (!payload.tipo_material_id) delete payload.tipo_material_id
      if (!payload.notas)            delete payload.notas
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

  const nombreParadas = options.paradas.map((p) => p.nombre)

  return (
    <Modal onClose={onClose} maxWidth={720}>
        <div className="modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>Nuevo viaje</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
              Completa los datos para registrar el viaje
            </p>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>
        ) : (
          <>
            {error && <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Ruta */}
              <SectionLabel>Ruta</SectionLabel>
              <div className="form-row">
                <div className="form-group">
                  <label>Origen</label>
                  <Combobox
                    value={form.origen}
                    onChange={setVal('origen')}
                    options={nombreParadas}
                    placeholder="Buscar origen…"
                  />
                </div>
                <div className="form-group">
                  <label>Destino</label>
                  <Combobox
                    value={form.destino}
                    onChange={setVal('destino')}
                    options={nombreParadas}
                    placeholder="Buscar destino…"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de viaje</label>
                  <select value={form.tipo} onChange={set('tipo')}>
                    <option value="carga">Carga</option>
                    <option value="descarga">Descarga</option>
                    <option value="adelantar_carga">Adelantar carga</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tipo de material</label>
                  <select value={form.tipo_material_id} onChange={set('tipo_material_id')}>
                    <option value="">— Sin especificar —</option>
                    {options.tiposMaterial.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Estado inicial</label>
                  <select value={form.estado} onChange={set('estado')}>
                    <option value="pendiente">Pendiente</option>
                    <option value="en_camino">En camino</option>
                  </select>
                </div>
              </div>

              {/* Asignación */}
              <SectionLabel>Asignación</SectionLabel>
              <div className="form-row">
                <div className="form-group">
                  <label>Camionero <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                  <select value={form.camionero_id} onChange={set('camionero_id')}>
                    <option value="">Sin asignar</option>
                    {options.camioneros.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre} {c.apellidos}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Vehículo <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                  <select value={form.vehiculo_id} onChange={set('vehiculo_id')}>
                    <option value="">Sin vehículo asignado</option>
                    {options.vehiculos.map((v) => (
                      <option key={v.id} value={v.id}>{v.matricula} — {v.marca} {v.modelo}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fechas */}
              <SectionLabel>Fechas previstas</SectionLabel>
              <div className="form-group">
                <label>Fecha inicio</label>
                <DatePicker
                  locale="es"
                  selected={form.fecha_inicio}
                  onChange={(date) => setForm((p) => ({ ...p, fecha_inicio: date }))}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Seleccionar fecha…"
                  isClearable
                  className="datepicker-input"
                  calendarClassName="datepicker-calendar"
                />
              </div>

              {/* Notas */}
              <div className="form-group">
                <label>Notas <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                <textarea value={form.notas} onChange={set('notas')} placeholder="Instrucciones especiales, observaciones…" rows={3} />
              </div>

              {/* Acciones */}
              <div style={{
                display: 'flex', gap: 10, justifyContent: 'flex-end',
                paddingTop: 8,
                borderTop: '1px solid var(--color-border)',
                marginTop: 4,
              }}>
                <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Guardando…' : 'Crear viaje'}
                </button>
              </div>
            </form>
          </>
        )}
    </Modal>
  )
}
