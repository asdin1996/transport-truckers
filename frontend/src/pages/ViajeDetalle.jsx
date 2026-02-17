import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getViaje, cambiarEstado } from '../services/viajes'
import { getGestiones, createGestion, updateGestion, deleteGestion } from '../services/gestiones'

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

export default function ViajeDetalle() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [viaje, setViaje]         = useState(null)
  const [gestiones, setGestiones] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [accionando, setAccionando] = useState(false)

  // Nueva gestión
  const [nuevoTexto, setNuevoTexto] = useState('')
  const [guardando, setGuardando]   = useState(false)

  // Edición inline
  const [editandoId, setEditandoId]     = useState(null)
  const [editTexto, setEditTexto]       = useState('')
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
          <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>
            ← Volver
          </button>
          <h2>
            {viaje.ruta?.origen ?? '?'} → {viaje.ruta?.destino ?? '?'}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {siguienteEstado && (
            <button
              className="btn btn--primary btn--sm"
              onClick={handleCambiarEstado}
              disabled={accionando}
            >
              {accionando ? 'Actualizando…' : `Marcar como ${ESTADO_LABELS[siguienteEstado]}`}
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
            <dt>Vehículo</dt>
            <dd>{viaje.vehiculo?.matricula ?? '—'} {viaje.vehiculo?.marca} {viaje.vehiculo?.modelo}</dd>
            <dt>Km estimados</dt>
            <dd>{viaje.ruta?.km_estimados ?? '—'} km</dd>
            <dt>Fecha inicio</dt>
            <dd>{viaje.fecha_inicio ? new Date(viaje.fecha_inicio).toLocaleDateString('es-ES') : '—'}</dd>
            <dt>Fecha fin</dt>
            <dd>{viaje.fecha_fin ? new Date(viaje.fecha_fin).toLocaleDateString('es-ES') : '—'}</dd>
            <dt>Notas</dt>
            <dd>{viaje.notas ?? '—'}</dd>
          </dl>
        </div>

        <div className="card">
          <p className="card__title">Ruta</p>
          <dl className="detail-list">
            <dt>Origen</dt>
            <dd>{viaje.ruta?.origen ?? '—'}</dd>
            <dt>Destino</dt>
            <dd>{viaje.ruta?.destino ?? '—'}</dd>
            {viaje.ruta?.paradas?.length > 0 && (
              <>
                <dt>Paradas</dt>
                <dd>{viaje.ruta.paradas.join(', ')}</dd>
              </>
            )}
          </dl>
        </div>
      </div>

      {/* Gestiones */}
      <div className="card" style={{ marginTop: 20 }}>
        <p className="card__title" style={{ marginBottom: 14 }}>Gestiones</p>

        {/* Formulario nueva gestión */}
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

        {/* Lista de gestiones */}
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
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => setEditandoId(null)}
                      >
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
                          <button className="btn btn--ghost btn--sm" onClick={() => handleStartEdit(g)}>
                            Editar
                          </button>
                          <button className="btn btn--danger btn--sm" onClick={() => handleDeleteGestion(g.id)}>
                            Eliminar
                          </button>
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
    </div>
  )
}
