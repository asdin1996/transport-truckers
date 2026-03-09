import './TripTimeline.css'

/**
 * paradas        – array de strings (nombres de parada)
 * completadas    – array de índices completados (ej: [0, 1])
 * canCheck       – si el usuario puede marcar paradas
 * onToggle       – fn(index) llamada al hacer check/uncheck
 */
export default function TripTimeline({ origen, destino, paradas = [], completadas = [], canCheck, onToggle }) {
  if (!origen && !destino) return null

  const stops = [
    { label: origen,  type: 'origin' },
    ...paradas.map((p, i) => ({ label: p, type: 'stop', index: i, done: completadas.includes(i) })),
    { label: destino, type: 'destination' },
  ]

  // Punto activo: último nodo completado + 1
  const lastDone = paradas.reduce((acc, _, i) => (completadas.includes(i) ? i + 1 : acc), -1)
  const activeIndex = lastDone + 1  // índice en `stops` (0 = origen, 1..n = paradas, n+1 = destino)

  return (
    <div className="trip-timeline">
      {stops.map((stop, si) => {
        const isActive  = si === activeIndex
        const isDone    = si < activeIndex || stop.type === 'origin' && completadas.length > 0
        const isOrigin  = stop.type === 'origin'
        const isDest    = stop.type === 'destination'
        const isStop    = stop.type === 'stop'

        let nodeClass = 'tl-node'
        if (isOrigin)  nodeClass += ' tl-node--origin'
        if (isDest)    nodeClass += ' tl-node--dest'
        if (isStop)    nodeClass += stop.done ? ' tl-node--done' : isActive ? ' tl-node--active' : ' tl-node--pending'

        return (
          <div key={si} className="tl-step">
            {/* Línea conectora izquierda */}
            {si > 0 && (
              <div className={`tl-line${si <= activeIndex ? ' tl-line--done' : ''}`} />
            )}

            {/* Nodo */}
            <div className="tl-node-wrap">
              <div className={nodeClass}>
                {isOrigin && <span>⬤</span>}
                {isDest   && <span>⬤</span>}
                {isStop   && (
                  canCheck ? (
                    <input
                      type="checkbox"
                      checked={stop.done}
                      onChange={() => onToggle(stop.index)}
                      className="tl-check"
                      title={stop.done ? 'Marcar como pendiente' : 'Marcar como completada'}
                    />
                  ) : (
                    <span>{stop.done ? '✓' : '○'}</span>
                  )
                )}
              </div>
              <span className="tl-label">{stop.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
