import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getViaje, cambiarEstado } from '../services/viajes'
import { getGastos, deleteGasto } from '../services/gastos'

const ESTADO_LABELS = {
  pendiente:  'Pendiente',
  en_curso:   'En curso',
  completado: 'Completado',
  cancelado:  'Cancelado',
}

const SIGUIENTE_ESTADO = {
  pendiente:  'en_curso',
  en_curso:   'completado',
}

export default function ViajeDetalle() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  const [viaje, setViaje] = useState(null)
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [accionando, setAccionando] = useState(false)

  const cargar = () =>
    Promise.all([getViaje(id), getGastos(id)])
      .then(([vRes, gRes]) => {
        setViaje(vRes.data.data)
        setGastos(gRes.data.data ?? [])
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

  const handleEliminarGasto = async (gastoId) => {
    if (!confirm('¿Eliminar este gasto?')) return
    try {
      await deleteGasto(gastoId)
      setGastos((prev) => prev.filter((g) => g.id !== gastoId))
    } catch {
      setError('No se pudo eliminar el gasto.')
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>
  if (error) return <div className="alert alert--error">{error}</div>
  if (!viaje) return null

  const totalGastos = gastos.reduce((s, g) => s + parseFloat(g.importe), 0)
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

      {/* Gastos */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p className="card__title" style={{ margin: 0 }}>
            Gastos — Total: {totalGastos.toFixed(2)} €
          </p>
          {viaje.estado !== 'completado' && viaje.estado !== 'cancelado' && (
            <Link to={`/viajes/${id}/gastos/nuevo`} className="btn btn--primary btn--sm">
              + Añadir gasto
            </Link>
          )}
        </div>

        {gastos.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Sin gastos registrados.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Importe</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {gastos.map((g) => (
                  <tr key={g.id}>
                    <td style={{ textTransform: 'capitalize' }}>{g.tipo}</td>
                    <td>{g.descripcion ?? '—'}</td>
                    <td>{parseFloat(g.importe).toFixed(2)} €</td>
                    <td>{g.fecha ? new Date(g.fecha).toLocaleDateString('es-ES') : '—'}</td>
                    <td>
                      {viaje.estado !== 'completado' && viaje.estado !== 'cancelado' && (
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={() => handleEliminarGasto(g.id)}
                        >
                          Eliminar
                        </button>
                      )}
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
