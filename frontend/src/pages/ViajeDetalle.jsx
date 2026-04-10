import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getViaje, cambiarEstado, updateViaje } from '../services/viajes'
import { getGestiones, createGestion, updateGestion, deleteGestion } from '../services/gestiones'
import { getCamioneros } from '../services/camioneros'
import { getVehiculos } from '../services/vehiculos'
import { getParadas } from '../services/paradas'

const ESTADO_LABELS = {
  pendiente:  'Pendiente',
  en_curso:   'En curso',
  completado: 'Completado',
  cancelado:  'Cancelado',
}

const SIGUIENTE_ESTADO = {
  pendiente: 'en_curso',
  en_curso:  'completado',
}

const ACCION_LABEL = {
  en_curso:   'Iniciar viaje',
  completado: 'Finalizar viaje',
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

export default function ViajeDetalle() {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [viaje, setViaje]           = useState(null)
  const [gestiones, setGestiones]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [accionando, setAccionando] = useState(false)

  const [editModal, setEditModal]   = useState(false)
  const [editForm, setEditForm]     = useState({})
  const [editOpts, setEditOpts]     = useState({ camioneros: [], vehiculos: [], paradas: [] })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError]   = useState(null)

  const [nuevoTexto, setNuevoTexto] = useState('')
  const [guardando, setGuardando]   = useState(false)

  const [editandoId, setEditandoId]       = useState(null)
  const [editTexto, setEditTexto]         = useState('')
  const [guardandoEdit, setGuardandoEdit] = useState(false)

  const cargar = () =>
    Promise.all([getViaje(id), getGestiones(id)])
      .then(([vRes, gRes]) => {
        setViaje(vRes.data.data)
        setGestiones(gRes.data.data ?? [])
      })
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
    const siguiente = SIGUIENTE_ESTADO[viaje.estado]
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

  const handleAddGestion = async (e) => {
    e.preventDefault()
    if (!nuevoTexto.trim()) return
    setGuardando(true)
    try {
      const res = await createGestion(id, { contenido: nuevoTexto.trim() })
      setGestiones((prev) => [res.data.data, ...prev])
      setNuevoTexto('')
    } catch {
      setError('No se pudo añadir la gestión.')
    } finally {
      setGuardando(false)
    }
  }

  const handleStartEdit = (g) => {
    setEditandoId(g.id)
    setEditTexto(g.contenido)
  }

  const handleSaveEdit = async (gestionId) => {
    if (!editTexto.trim()) return
    setGuardandoEdit(true)
    try {
      await updateGestion(id, gestionId, { contenido: editTexto.trim() })
      setGestiones((prev) =>
        prev.map((g) => g.id === gestionId ? { ...g, contenido: editTexto.trim() } : g)
      )
      setEditandoId(null)
    } catch {
      setError('No se pudo guardar la gestión.')
    } finally {
      setGuardandoEdit(false)
    }
  }

  const handleDeleteGestion = async (gestionId) => {
    if (!confirm('¿Eliminar esta gestión?')) return
    try {
      await deleteGestion(id, gestionId)
      setGestiones((prev) => prev.filter((g) => g.id !== gestionId))
    } catch {
      setError('No se pudo eliminar la gestión.')
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>
  if (error)   return <div className="alert alert--error">{error}</div>
  if (!viaje)  return null

  const siguienteEstado = SIGUIENTE_ESTADO[viaje.estado]

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>← Volver</button>
          <h2>{viaje.origen ?? '?'} → {viaje.destino ?? '?'}</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(isAdmin() || (viaje.estado === 'pendiente' && user?.id === viaje.camionero?.user_id)) && (
            <button className="btn btn--ghost btn--sm" onClick={() => abrirEdicion(viaje)}>
              Editar
            </button>
          )}
          {siguienteEstado && (
            <button
              className={`btn btn--sm ${siguienteEstado === 'completado' ? 'btn--danger' : 'btn--primary'}`}
              onClick={handleCambiarEstado}
              disabled={accionando}
            >
              {accionando ? 'Actualizando…' : ACCION_LABEL[siguienteEstado]}
            </button>
          )}
        </div>
      </div>

      {/* Info del viaje */}
      <div className="detail-grid">
        <div className="card">
          <p className="card__title">Información del viaje</p>
          <dl className="detail-list">
            <dt>Estado</dt>
            <dd>
              <span className={`badge badge--${viaje.estado}`}>
                {ESTADO_LABELS[viaje.estado]}
              </span>
            </dd>
            <dt>Tipo</dt>
            <dd style={{ textTransform: 'capitalize' }}>{viaje.tipo ?? '—'}</dd>
            <dt>Origen</dt>
            <dd>{viaje.origen ?? '—'}</dd>
            <dt>Destino</dt>
            <dd>{viaje.destino ?? '—'}</dd>
            <dt>Vehículo</dt>
            <dd>{viaje.vehiculo?.matricula ?? '—'} {viaje.vehiculo?.marca} {viaje.vehiculo?.modelo}</dd>
            <dt>Fecha prevista inicio</dt>
            <dd>{viaje.fecha_inicio ? new Date(viaje.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES') : '—'}</dd>
            <dt>Fecha prevista fin</dt>
            <dd>{viaje.fecha_fin ? new Date(viaje.fecha_fin + 'T00:00:00').toLocaleDateString('es-ES') : '—'}</dd>
            <dt>Inicio real</dt>
            <dd>{formatHora(viaje.hora_inicio)}</dd>
            <dt>Fin real</dt>
            <dd>{formatHora(viaje.hora_fin)}</dd>
            <dt>Duración</dt>
            <dd>{formatDuracion(viaje.duracion_minutos)}</dd>
            <dt>Notas</dt>
            <dd>{viaje.notas ?? '—'}</dd>
          </dl>
        </div>
      </div>

      {/* Gestiones */}
      <div className="card" style={{ marginTop: 20 }}>
        <p className="card__title" style={{ marginBottom: 14 }}>Gestiones</p>

        <form onSubmit={handleAddGestion} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <textarea
            value={nuevoTexto}
            onChange={(e) => setNuevoTexto(e.target.value)}
            placeholder="Añadir una gestión o comentario…"
            rows={2}
            style={{
              flex: 1,
              background: 'var(--color-surface2)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              color: 'var(--color-text)',
              padding: '8px 10px',
              fontSize: 13,
              resize: 'vertical',
            }}
          />
          <button
            type="submit"
            className="btn btn--primary btn--sm"
            disabled={guardando || !nuevoTexto.trim()}
            style={{ alignSelf: 'flex-end' }}
          >
            {guardando ? '…' : 'Añadir'}
          </button>
        </form>

        {gestiones.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Sin gestiones registradas.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {gestiones.map((g) => (
              <div
                key={g.id}
                style={{
                  background: 'var(--color-surface2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: '10px 12px',
                }}
              >
                {editandoId === g.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea
                      value={editTexto}
                      onChange={(e) => setEditTexto(e.target.value)}
                      rows={3}
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-primary)',
                        borderRadius: 4,
                        color: 'var(--color-text)',
                        padding: '6px 8px',
                        fontSize: 13,
                        resize: 'vertical',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() => handleSaveEdit(g.id)}
                        disabled={guardandoEdit || !editTexto.trim()}
                      >
                        {guardandoEdit ? 'Guardando…' : 'Guardar'}
                      </button>
                      <button className="btn btn--ghost btn--sm" onClick={() => setEditandoId(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: 13, marginBottom: 6, whiteSpace: 'pre-wrap' }}>{g.contenido}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {g.user?.name ?? '—'} · {new Date(g.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      {(user?.id === g.user_id || user?.role === 'admin') && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn--ghost btn--sm" onClick={() => handleStartEdit(g)}>Editar</button>
                          <button className="btn btn--danger btn--sm" onClick={() => handleDeleteGestion(g.id)}>Eliminar</button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
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
                        <option value="en_curso">En curso</option>
                        <option value="completado">Completado</option>
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
