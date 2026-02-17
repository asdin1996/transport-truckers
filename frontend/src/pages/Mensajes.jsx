import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMensajesConversacion, sendMensaje, marcarLeidos } from '../services/mensajes'
import api from '../services/api'

export default function Mensajes() {
  const { user, isAdmin } = useAuth()

  // Admin: selecciona camionero; camionero: habla con admin
  const [camioneros, setCamioneros]       = useState([])
  const [selectedUser, setSelectedUser]   = useState(null)
  const [mensajes, setMensajes]           = useState([])
  const [texto, setTexto]                 = useState('')
  const [enviando, setEnviando]           = useState(false)
  const [error, setError]                 = useState(null)
  const bottomRef = useRef(null)

  // Cargar lista de camioneros (solo admin)
  useEffect(() => {
    if (!isAdmin()) return
    api.get('/camioneros')
      .then((r) => setCamioneros(r.data.data ?? []))
      .catch(() => setError('No se pudieron cargar los camioneros.'))
  }, [])

  // Si es camionero, el interlocutor es siempre admin (user_id = null → buscar admin)
  useEffect(() => {
    if (!isAdmin()) {
      api.get('/me').then((r) => {
        // Usamos un userId especial 0 para indicar "admin"
        setSelectedUser({ id: 0, nombre: 'Administrador' })
      })
    }
  }, [])

  const cargarMensajes = (interlocutorId) => {
    getMensajesConversacion(interlocutorId)
      .then((r) => {
        setMensajes(r.data.data ?? [])
        marcarLeidos(interlocutorId).catch(() => {})
      })
      .catch(() => setError('Error al cargar mensajes.'))
  }

  useEffect(() => {
    if (selectedUser) cargarMensajes(selectedUser.id)
  }, [selectedUser])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const handleEnviar = async (e) => {
    e.preventDefault()
    if (!texto.trim() || !selectedUser) return
    setEnviando(true)
    try {
      await sendMensaje({ receptor_id: selectedUser.id, contenido: texto.trim() })
      setTexto('')
      cargarMensajes(selectedUser.id)
    } catch {
      setError('No se pudo enviar el mensaje.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 120px)' }}>

      {/* Panel izquierdo: lista de camioneros (solo admin) */}
      {isAdmin() && (
        <div style={{
          width: 220,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <p style={{ padding: '12px 14px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid var(--color-border)' }}>
            Camioneros
          </p>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {camioneros.length === 0 && (
              <p style={{ padding: 14, color: 'var(--color-text-muted)', fontSize: 13 }}>Sin camioneros.</p>
            )}
            {camioneros.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedUser({ id: c.user_id, nombre: `${c.nombre} ${c.apellidos}` })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: selectedUser?.id === c.user_id ? 'rgba(186,53,52,0.12)' : 'transparent',
                  border: 'none',
                  borderLeft: selectedUser?.id === c.user_id ? '3px solid var(--color-primary)' : '3px solid transparent',
                  color: selectedUser?.id === c.user_id ? 'var(--color-primary)' : 'var(--color-text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 13,
                  transition: 'background 0.15s',
                }}
              >
                {c.nombre} {c.apellidos}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Panel derecho: conversación */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        {/* Cabecera */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontWeight: 600, fontSize: 13 }}>
          {selectedUser ? `Conversación con ${selectedUser.nombre}` : 'Selecciona un camionero'}
        </div>

        {/* Mensajes */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {error && <div className="alert alert--error">{error}</div>}
          {!selectedUser && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
              {isAdmin() ? 'Selecciona un camionero para ver la conversación.' : 'Cargando…'}
            </p>
          )}
          {mensajes.map((m) => {
            const esMio = m.emisor_id === user?.id
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: esMio ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '70%',
                  background: esMio ? 'var(--color-primary)' : 'var(--color-surface2)',
                  color: esMio ? '#fff' : 'var(--color-text)',
                  borderRadius: esMio ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  padding: '8px 12px',
                  fontSize: 13,
                }}>
                  <p style={{ marginBottom: 4 }}>{m.contenido}</p>
                  <p style={{ fontSize: 10, opacity: 0.7, textAlign: 'right' }}>
                    {new Date(m.created_at).toLocaleString('es-ES', { timeStyle: 'short', dateStyle: 'short' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {selectedUser && (
          <form
            onSubmit={handleEnviar}
            style={{
              display: 'flex',
              gap: 8,
              padding: '12px 16px',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe un mensaje…"
              style={{
                flex: 1,
                background: 'var(--color-surface2)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                color: 'var(--color-text)',
                padding: '8px 12px',
                fontSize: 13,
              }}
            />
            <button
              type="submit"
              className="btn btn--primary btn--sm"
              disabled={enviando || !texto.trim()}
            >
              {enviando ? '…' : 'Enviar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
