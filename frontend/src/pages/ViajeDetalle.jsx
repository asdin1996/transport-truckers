import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getViaje, cambiarEstado, updateViaje, cancelarViaje } from '../services/viajes'
import { getCamioneros } from '../services/camioneros'
import { getVehiculos } from '../services/vehiculos'
import { getParadas } from '../services/paradas'
import { getTiposMaterial } from '../services/tiposMaterial'
import { getOrganizacionesContratantes } from '../services/organizacionesContratantes'
import { getMotivosCancelacion } from '../services/motivosCancelacion'
import Combobox from '../components/Combobox'
import Modal from '../components/Modal'

const ESTADO_LABELS = {
  pendiente:        'Pendiente',
  en_camino:        'En camino',
  llegada_destino:  'Llegada a destino',
  cargando:         'Cargando',
  descargando:      'Descargando',
  finalizado:       'Finalizado',
  cancelado:        'Cancelado',
}

const TIPO_LABELS = {
  carga_completa:   'Carga Completa',
  descarga_completa:'Descarga Completa',
  dormir:           'Dormir (Adelantar Carga)',
  vacio:            'Vacío',
  carga_parcial:    'Carga Parcial',
  descarga_parcial: 'Descarga Parcial',
  // compatibilidad con valores anteriores
  carga:            'Carga',
  descarga:         'Descarga',
  adelantar_carga:  'Adelantar carga',
}

const TIPOS_VIAJE_OPTIONS = [
  { value: 'carga_completa',    label: 'Carga Completa' },
  { value: 'descarga_completa', label: 'Descarga Completa' },
  { value: 'dormir',            label: 'Dormir (Adelantar Carga)' },
  { value: 'vacio',             label: 'Vacío' },
  { value: 'carga_parcial',     label: 'Carga Parcial' },
  { value: 'descarga_parcial',  label: 'Descarga Parcial' },
]

// Flujos por tipo de viaje
const FLUJOS = {
  carga_completa:   ['pendiente', 'en_camino', 'llegada_destino', 'cargando',    'finalizado'],
  descarga_completa:['pendiente', 'en_camino', 'llegada_destino', 'descargando', 'finalizado'],
  dormir:           ['pendiente', 'en_camino', 'llegada_destino',                'finalizado'],
  vacio:            ['pendiente', 'en_camino', 'llegada_destino',                'finalizado'],
  carga_parcial:    ['pendiente', 'en_camino', 'llegada_destino', 'cargando',    'finalizado'],
  descarga_parcial: ['pendiente', 'en_camino', 'llegada_destino', 'descargando', 'finalizado'],
  // compatibilidad
  carga:            ['pendiente', 'en_camino', 'llegada_destino', 'cargando',    'finalizado'],
  descarga:         ['pendiente', 'en_camino', 'llegada_destino', 'descargando', 'finalizado'],
  adelantar_carga:  ['pendiente', 'en_camino', 'llegada_destino',                'finalizado'],
}

function getFlujo(tipo) {
  return FLUJOS[tipo] ?? ['pendiente', 'en_camino', 'llegada_destino', 'finalizado']
}

function getSiguienteEstado(estado, tipo) {
  const flujo = getFlujo(tipo)
  const normalizado = { en_curso: 'en_camino', completado: 'finalizado' }[estado] ?? estado
  const idx = flujo.indexOf(normalizado)
  if (idx === -1 || idx >= flujo.length - 1) return null
  return flujo[idx + 1]
}

const ACCION_LABEL = {
  en_camino:        'Iniciar viaje',
  llegada_destino:  'Llegada a destino',
  cargando:         'Iniciar carga',
  descargando:      'Iniciar descarga',
  finalizado:       'Finalizar viaje',
}

function formatDuracion(minutos) {
  if (!minutos) return '—'
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  if (h > 0 && m > 0) return `${h}h ${String(m).padStart(2, '0')}min`
  if (h > 0)          return `${h}h`
  return `${m} min`
}

function formatHora(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
}

function InfoField({ label, children, full }) {
  return (
    <div className={`info-field${full ? ' info-field--full' : ''}`}>
      <span className="info-field__label">{label}</span>
      <span className="info-field__value">{children ?? '—'}</span>
    </div>
  )
}

const ESTADO_ALIAS = { en_curso: 'en_camino', completado: 'finalizado' }

function TripStepper({ estado, tipo }) {
  const flujo = getFlujo(tipo)
  const normalizado = ESTADO_ALIAS[estado] ?? estado
  const currentIdx = flujo.indexOf(normalizado)

  return (
    <div style={{ padding: '20px 0 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {flujo.map((step, i) => {
          const done   = i < currentIdx
          const active = i === currentIdx
          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < flujo.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  border: `2px solid ${active ? 'var(--color-primary)' : done ? '#66bb6a' : 'var(--color-border)'}`,
                  background: active ? 'var(--color-primary)' : done ? '#66bb6a22' : 'transparent',
                  color: active ? '#fff' : done ? '#66bb6a' : 'var(--color-text-muted)',
                  flexShrink: 0,
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--color-text)' : done ? '#66bb6a' : 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                }}>
                  {ESTADO_LABELS[step]}
                </span>
              </div>
              {i < flujo.length - 1 && (
                <div style={{
                  flex: 1,
                  height: 2,
                  background: done ? '#66bb6a' : 'var(--color-border)',
                  margin: '0 4px',
                  marginBottom: 22,
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ViajeDetalle() {
  const { id } = useParams()
  const { user, isAdmin, isGestor } = useAuth()
  const navigate = useNavigate()

  const [viaje, setViaje]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [accionando, setAccionando] = useState(false)

  const [editModal, setEditModal]   = useState(false)
  const [editForm, setEditForm]     = useState({})
  const [editOpts, setEditOpts]     = useState({ camioneros: [], vehiculos: [], paradas: [], tiposMaterial: [], organizaciones: [] })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError]   = useState(null)

  // Modal cancelar
  const [cancelModal, setCancelModal]   = useState(false)
  const [motivos, setMotivos]           = useState([])
  const [motivoId, setMotivoId]         = useState('')
  const [cancelando, setCancelando]     = useState(false)
  const [cancelError, setCancelError]   = useState(null)

  const cargar = () =>
    getViaje(id)
      .then((res) => setViaje(res.data.data))
      .catch(() => setError('Error al cargar el viaje.'))
      .finally(() => setLoading(false))

  useEffect(() => { cargar() }, [id])

  const abrirEdicion = async (v) => {
    setEditError(null)
    setEditForm({
      camionero_id:                v.camionero_id                ?? '',
      vehiculo_id:                 v.vehiculo_id                 ?? '',
      tipo:                        v.tipo                         ?? 'carga_completa',
      tipo_material_id:            v.tipo_material_id             ?? '',
      organizacion_contratante_id: v.organizacion_contratante_id ?? '',
      origen:                      v.origen                       ?? '',
      destino:                     v.destino                      ?? '',
      estado:                      v.estado                       ?? 'pendiente',
      fecha_inicio:                v.fecha_inicio ? v.fecha_inicio.slice(0, 10) : '',
      fecha_fin:                   v.fecha_fin    ? v.fecha_fin.slice(0, 10)    : '',
      notas:                       v.notas                        ?? '',
    })
    if (isAdmin() && editOpts.camioneros.length === 0) {
      try {
        const [cRes, vRes, pRes, tmRes, orgRes] = await Promise.all([
          getCamioneros(),
          getVehiculos(),
          getParadas(),
          getTiposMaterial(),
          getOrganizacionesContratantes(),
        ])
        setEditOpts({
          camioneros:    cRes.data.data   ?? [],
          vehiculos:     vRes.data.data   ?? [],
          paradas:       pRes.data.data   ?? [],
          tiposMaterial: tmRes.data.data  ?? [],
          organizaciones: orgRes.data.data ?? [],
        })
      } catch {
        setEditError('No se pudieron cargar los datos.')
      }
    }
    setEditModal(true)
  }

  const handleGuardarEdicion = async (e) => {
    e.preventDefault()
    setEditSaving(true)
    setEditError(null)
    try {
      const payload = { ...editForm }
      if (!payload.fecha_inicio)                delete payload.fecha_inicio
      if (!payload.fecha_fin)                   delete payload.fecha_fin
      if (!payload.notas)                       delete payload.notas
      if (!payload.tipo_material_id)            payload.tipo_material_id = null
      if (!payload.organizacion_contratante_id) payload.organizacion_contratante_id = null
      await updateViaje(id, payload)
      setEditModal(false)
      await cargar()
    } catch (err) {
      const msgs = err.response?.data?.errors
      setEditError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al guardar.')
    } finally {
      setEditSaving(false)
    }
  }

  const setEdit = (f) => (e) => setEditForm((prev) => ({ ...prev, [f]: e.target.value }))

  const abrirCancelar = async () => {
    setCancelError(null)
    setMotivoId('')
    if (motivos.length === 0) {
      try {
        const res = await getMotivosCancelacion()
        setMotivos(res.data.data ?? [])
      } catch {
        setCancelError('No se pudieron cargar los motivos.')
      }
    }
    setCancelModal(true)
  }

  const handleCancelar = async (e) => {
    e.preventDefault()
    setCancelando(true)
    setCancelError(null)
    try {
      await cancelarViaje(id, motivoId || null)
      setCancelModal(false)
      await cargar()
    } catch (err) {
      const msgs = err.response?.data?.errors
      setCancelError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al cancelar el viaje.')
    } finally {
      setCancelando(false)
    }
  }

  const handleCambiarEstado = async () => {
    const siguiente = getSiguienteEstado(viaje.estado, viaje.tipo)
    if (!siguiente) return
    setAccionando(true)
    try {
      await cambiarEstado(id, siguiente)
      await cargar()
    } catch {
      setError('No se pudo cambiar el estado.')
    } finally {
      setAccionando(false)
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>
  if (error)   return <div className="alert alert--error">{error}</div>
  if (!viaje)  return null

  const siguienteEstado = getSiguienteEstado(viaje.estado, viaje.tipo)
  const puedeEditar = isAdmin() || isGestor() ||
    (['pendiente', 'en_camino'].includes(viaje.estado) && viaje.camionero?.user_id === user?.id)
  const puedeCancelar = isAdmin() && viaje.estado !== 'cancelado' && viaje.estado !== 'finalizado'

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>← Volver</button>
          <h2 style={{ margin: 0 }}>{viaje.origen ?? '?'} → {viaje.destino ?? '?'}</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {puedeCancelar && (
            <button className="btn btn--danger btn--sm" onClick={abrirCancelar}>
              Cancelar viaje
            </button>
          )}
          {puedeEditar && (
            <button className="btn btn--ghost btn--sm" onClick={() => abrirEdicion(viaje)}>
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Stepper + acción principal */}
      {viaje.estado !== 'cancelado' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <TripStepper estado={viaje.estado} tipo={viaje.tipo} />
          {siguienteEstado && (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 16 }}>
              <button
                className={`btn btn--lg ${siguienteEstado === 'finalizado' ? 'btn--success' : 'btn--primary'}`}
                onClick={handleCambiarEstado}
                disabled={accionando}
              >
                {accionando ? 'Actualizando…' : ACCION_LABEL[siguienteEstado]}
              </button>
            </div>
          )}
          {(viaje.estado === 'finalizado' || viaje.estado === 'completado') && (
            <p style={{ textAlign: 'center', color: '#66bb6a', fontWeight: 600, paddingTop: 8, fontSize: 14 }}>
              Viaje completado
            </p>
          )}
        </div>
      )}

      {/* Info cancelación */}
      {viaje.estado === 'cancelado' && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--color-primary)' }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-primary)' }}>Viaje cancelado</p>
          {viaje.motivo_cancelacion && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Motivo: {viaje.motivo_cancelacion.nombre}
            </p>
          )}
        </div>
      )}

      {/* Información del viaje */}
      <div className="card">
        <p className="card__title" style={{ marginBottom: 18 }}>Información del viaje</p>

        <div className="form-row--3" style={{ marginBottom: 18 }}>
          <InfoField label="Estado">
            <span className={`badge badge--${viaje.estado}`}>{ESTADO_LABELS[viaje.estado]}</span>
          </InfoField>
          <InfoField label="Tipo">{TIPO_LABELS[viaje.tipo] ?? viaje.tipo ?? '—'}</InfoField>
          <InfoField label="Vehículo">
            {viaje.vehiculo
              ? `${viaje.vehiculo.matricula} · ${viaje.vehiculo.marca} ${viaje.vehiculo.modelo}`
              : '—'}
          </InfoField>
        </div>

        <div className="form-row--3" style={{ marginBottom: 18 }}>
          <InfoField label="Origen">{viaje.origen}</InfoField>
          <InfoField label="Destino">{viaje.destino}</InfoField>
          <InfoField label="Camionero">
            {viaje.camionero ? `${viaje.camionero.nombre} ${viaje.camionero.apellidos}` : '—'}
          </InfoField>
        </div>

        <div className="form-row--3" style={{ marginBottom: 18 }}>
          <InfoField label="Material">
            {viaje.tipo_material?.nombre ?? '—'}
          </InfoField>
          <InfoField label="Organización contratante">
            {viaje.organizacion_contratante?.nombre ?? '—'}
          </InfoField>
          <InfoField label="Duración real">{formatDuracion(viaje.duracion_minutos)}</InfoField>
        </div>

        <div className="form-row--3" style={{ marginBottom: 18 }}>
          <InfoField label="Fecha prevista inicio">
            {viaje.fecha_inicio ? new Date(viaje.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES') : '—'}
          </InfoField>
          <InfoField label="Fecha prevista fin">
            {viaje.fecha_fin ? new Date(viaje.fecha_fin + 'T00:00:00').toLocaleDateString('es-ES') : '—'}
          </InfoField>
          <div />
        </div>

        <div className="form-row--3" style={{ marginBottom: 18 }}>
          <InfoField label="Inicio real">{formatHora(viaje.hora_inicio)}</InfoField>
          <InfoField label="Fin real">{formatHora(viaje.hora_fin)}</InfoField>
          <div />
        </div>

        {viaje.notas && (
          <div className="form-row--3">
            <InfoField label="Notas" full>{viaje.notas}</InfoField>
          </div>
        )}
      </div>

      {/* Modal cancelar viaje */}
      {cancelModal && (
        <Modal onClose={() => setCancelModal(false)} maxWidth={480}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>Cancelar viaje</h3>
            <button className="btn btn--ghost btn--sm" onClick={() => setCancelModal(false)}>✕</button>
          </div>

          {cancelError && <div className="alert alert--error" style={{ marginBottom: 12 }}>{cancelError}</div>}

          <form onSubmit={handleCancelar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Motivo de cancelación <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
              <select value={motivoId} onChange={(e) => setMotivoId(e.target.value)}>
                <option value="">— Sin especificar —</option>
                {motivos.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>

            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
              Esta acción no se puede deshacer. El viaje quedará marcado como cancelado.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn--ghost" onClick={() => setCancelModal(false)}>Volver</button>
              <button type="submit" className="btn btn--danger" disabled={cancelando}>
                {cancelando ? 'Cancelando…' : 'Confirmar cancelación'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal edición */}
      {editModal && (
        <Modal onClose={() => setEditModal(false)} maxWidth={560}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Editar viaje</h3>
              <button className="btn btn--ghost btn--sm" onClick={() => setEditModal(false)}>✕</button>
            </div>

            {editError && <div className="alert alert--error" style={{ marginBottom: 12 }}>{editError}</div>}

            <form onSubmit={handleGuardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isAdmin() && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tipo</label>
                      <select value={editForm.tipo} onChange={setEdit('tipo')}>
                        {TIPOS_VIAJE_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Estado</label>
                      <select value={editForm.estado} onChange={setEdit('estado')}>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_camino">En camino</option>
                        <option value="llegada_destino">Llegada a destino</option>
                        <option value="cargando">Cargando</option>
                        <option value="descargando">Descargando</option>
                        <option value="finalizado">Finalizado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Origen</label>
                      <Combobox
                        value={editForm.origen}
                        onChange={(v) => setEditForm((p) => ({ ...p, origen: v }))}
                        options={editOpts.paradas.map((p) => p.nombre)}
                        placeholder="Buscar origen…"
                      />
                    </div>
                    <div className="form-group">
                      <label>Destino</label>
                      <Combobox
                        value={editForm.destino}
                        onChange={(v) => setEditForm((p) => ({ ...p, destino: v }))}
                        options={editOpts.paradas.map((p) => p.nombre)}
                        placeholder="Buscar destino…"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Material</label>
                      <select value={editForm.tipo_material_id} onChange={setEdit('tipo_material_id')}>
                        <option value="">— Sin especificar —</option>
                        {editOpts.tiposMaterial.map((t) => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Organización contratante</label>
                      <select value={editForm.organizacion_contratante_id} onChange={setEdit('organizacion_contratante_id')}>
                        <option value="">— Sin especificar —</option>
                        {editOpts.organizaciones.map((o) => (
                          <option key={o.id} value={o.id}>{o.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Camionero <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                    <select value={editForm.camionero_id} onChange={setEdit('camionero_id')}>
                      <option value="">Sin asignar</option>
                      {editOpts.camioneros.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre} {c.apellidos}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Vehículo</label>
                    <select value={editForm.vehiculo_id} onChange={setEdit('vehiculo_id')}>
                      <option value="">Sin vehículo</option>
                      {editOpts.vehiculos.map((v) => (
                        <option key={v.id} value={v.id}>{v.matricula} — {v.marca} {v.modelo}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Fecha prevista inicio</label>
                      <input type="date" value={editForm.fecha_inicio} onChange={setEdit('fecha_inicio')} />
                    </div>
                    <div className="form-group">
                      <label>Fecha prevista fin</label>
                      <input type="date" value={editForm.fecha_fin} onChange={setEdit('fecha_fin')} />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Notas</label>
                <textarea value={editForm.notas} onChange={setEdit('notas')} rows={3} placeholder="Instrucciones especiales…" />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setEditModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn--primary" disabled={editSaving}>
                  {editSaving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
        </Modal>
      )}
    </div>
  )
}
