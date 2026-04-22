import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getViaje, cambiarEstado, updateViaje } from '../services/viajes'
import { getCamioneros } from '../services/camioneros'
import { getVehiculos } from '../services/vehiculos'
import { getParadas } from '../services/paradas'

const ESTADO_LABELS = {
  pendiente:   'Pendiente',
  en_camino:   'En camino',
  cargando:    'Cargando',
  descargando: 'Descargando',
  finalizado:  'Finalizado',
  cancelado:   'Cancelado',
}

const FLUJO_CARGA    = ['pendiente', 'en_camino', 'cargando',    'finalizado']
const FLUJO_DESCARGA = ['pendiente', 'en_camino', 'descargando', 'finalizado']

function getFlujo(tipo) {
  return tipo === 'descarga' ? FLUJO_DESCARGA : FLUJO_CARGA
}

function getSiguienteEstado(estado, tipo) {
  if (estado === 'pendiente')  return 'en_camino'
  if (estado === 'en_camino')  return tipo === 'descarga' ? 'descargando' : 'cargando'
  if (estado === 'cargando' || estado === 'descargando') return 'finalizado'
  return null
}

const ACCION_LABEL = {
  en_camino:   'Comenzar viaje',
  cargando:    'Cargar mercancía',
  descargando: 'Descargar mercancía',
  finalizado:  'Finalizar viaje',
}

function formatDuracion(minutos) {
  if (!minutos) return '—'
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return h > 0 ? `${h}h ${m}min` : `${m}min`
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

function TripStepper({ estado, tipo }) {
  const flujo = getFlujo(tipo)
  const currentIdx = flujo.indexOf(estado)

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
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [viaje, setViaje]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [accionando, setAccionando] = useState(false)

  const [editModal, setEditModal]   = useState(false)
  const [editForm, setEditForm]     = useState({})
  const [editOpts, setEditOpts]     = useState({ camioneros: [], vehiculos: [], paradas: [] })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError]   = useState(null)

  const cargar = () =>
    getViaje(id)
      .then((res) => setViaje(res.data.data))
      .catch(() => setError('Error al cargar el viaje.'))
      .finally(() => setLoading(false))

  useEffect(() => { cargar() }, [id])

  const abrirEdicion = async (v) => {
    setEditError(null)
    setEditForm({
      camionero_id: v.camionero_id ?? '',
      vehiculo_id:  v.vehiculo_id  ?? '',
      tipo:         v.tipo         ?? 'carga',
      origen:       v.origen       ?? '',
      destino:      v.destino      ?? '',
      estado:       v.estado       ?? 'pendiente',
      fecha_inicio: v.fecha_inicio ? v.fecha_inicio.slice(0, 10) : '',
      fecha_fin:    v.fecha_fin    ? v.fecha_fin.slice(0, 10)    : '',
      notas:        v.notas        ?? '',
    })
    if (isAdmin() && editOpts.camioneros.length === 0) {
      try {
        const [cRes, vRes, pRes] = await Promise.all([getCamioneros(), getVehiculos(), getParadas()])
        setEditOpts({
          camioneros: cRes.data.data ?? [],
          vehiculos:  vRes.data.data ?? [],
          paradas:    pRes.data.data ?? [],
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
      if (!payload.fecha_inicio) delete payload.fecha_inicio
      if (!payload.fecha_fin)    delete payload.fecha_fin
      if (!payload.notas)        delete payload.notas
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
  const puedeAccionar   = isAdmin() || viaje.camionero?.user_id === user?.id
  const puedeEditar     = isAdmin() || (['pendiente', 'en_camino'].includes(viaje.estado) && viaje.camionero?.user_id === user?.id)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>← Volver</button>
          <h2 style={{ margin: 0 }}>{viaje.origen ?? '?'} → {viaje.destino ?? '?'}</h2>
        </div>
        {puedeEditar && (
          <button className="btn btn--ghost btn--sm" onClick={() => abrirEdicion(viaje)}>
            Editar
          </button>
        )}
      </div>

      {/* Stepper + acción principal */}
      {viaje.estado !== 'cancelado' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <TripStepper estado={viaje.estado} tipo={viaje.tipo} />
          {siguienteEstado && puedeAccionar && (
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
          {viaje.estado === 'finalizado' && (
            <p style={{ textAlign: 'center', color: '#66bb6a', fontWeight: 600, paddingTop: 8, fontSize: 14 }}>
              Viaje completado
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
          <InfoField label="Tipo" >{viaje.tipo ? viaje.tipo.charAt(0).toUpperCase() + viaje.tipo.slice(1) : '—'}</InfoField>
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
          <InfoField label="Fecha prevista inicio">
            {viaje.fecha_inicio ? new Date(viaje.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES') : '—'}
          </InfoField>
          <InfoField label="Fecha prevista fin">
            {viaje.fecha_fin ? new Date(viaje.fecha_fin + 'T00:00:00').toLocaleDateString('es-ES') : '—'}
          </InfoField>
          <InfoField label="Duración real">{formatDuracion(viaje.duracion_minutos)}</InfoField>
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

      {/* Modal edición */}
      {editModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setEditModal(false)}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 8,
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
                        <option value="carga">Carga</option>
                        <option value="descarga">Descarga</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Estado</label>
                      <select value={editForm.estado} onChange={setEdit('estado')}>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_camino">En camino</option>
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
                      <input list="edit-paradas-origen" value={editForm.origen} onChange={setEdit('origen')} placeholder="Origen…" />
                      <datalist id="edit-paradas-origen">
                        {editOpts.paradas.map((p) => <option key={p.id} value={p.nombre} />)}
                      </datalist>
                    </div>
                    <div className="form-group">
                      <label>Destino</label>
                      <input list="edit-paradas-destino" value={editForm.destino} onChange={setEdit('destino')} placeholder="Destino…" />
                      <datalist id="edit-paradas-destino">
                        {editOpts.paradas.map((p) => <option key={p.id} value={p.nombre} />)}
                      </datalist>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Camionero</label>
                    <select value={editForm.camionero_id} onChange={setEdit('camionero_id')} required>
                      <option value="">Seleccionar…</option>
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
          </div>
        </div>
      )}
    </div>
  )
}
