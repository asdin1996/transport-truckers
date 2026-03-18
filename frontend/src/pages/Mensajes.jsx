import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMensajesConversacion, sendMensaje, marcarLeidos } from '../services/mensajes'
import api from '../services/api'

export default function Mensajes() {
  const { user } = useAuth()

  const [contactos, setContactos]       = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [mensajes, setMensajes]         = useState([])
  const [texto, setTexto]               = useState('')
  const [enviando, setEnviando]         = useState(false)
  const [error, setError]               = useState(null)
  const [busqueda, setBusqueda]         = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    api.get('/contactos')
      .then((r) => setContactos(r.data.data ?? []))
      .catch(() => setError('No se pudieron cargar los contactos.'))
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
      await sendMensaje({ para_user_id: selectedUser.id, contenido: texto.trim() })
      setTexto('')
      cargarMensajes(selectedUser.id)
    } catch {
      setError('No se pudo enviar el mensaje.')
    } finally {
      setEnviando(false)
    }
  }

  const contactosFiltrados = busqueda.trim()
    ? contactos.filter((c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : contactos

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 120px)' }}>

      {/* Panel izquierdo: lista de contactos */}
      <div style={{
        width: 240,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <p style={{ padding: '12px 14px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          Contactos
        </p>

        {/* Buscador de contactos */}
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div className="table-search" style={{ maxWidth: '100%' }}>
            <span className="table-search__icon">⌕</span>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar…"
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {contactosFiltrados.length === 0 && (
            <p style={{ padding: 14, color: 'var(--color-text-muted)', fontSize: 13 }}>Sin contactos.</p>
          )}
          {contactosFiltrados.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedUser(c)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: selectedUser?.id === c.id ? 'rgba(186,53,52,0.12)' : 'transparent',
                border: 'none',
                borderLeft: selectedUser?.id === c.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ fontSize: 13, color: selectedUser?.id === c.id ? 'var(--color-primary)' : 'var(--color-text)', fontWeight: 500 }}>
                {c.nombre}
              </div>
              <div style={{ fontSize: 11, marginTop: 2 }}>
                {c.role === 'admin'
                  ? <span className="badge badge--admin">Admin</span>
                  : <span className="badge badge--camionero">Camionero</span>
                }
              </div>
            </button>
          ))}
        </div>
      </div>

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
          {selectedUser ? `Conversación con ${selectedUser.nombre}` : 'Selecciona un contacto'}
        </div>

        {/* Mensajes */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {error && <div className="alert alert--error">{error}</div>}
          {!selectedUser && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
              Selecciona un contacto para ver la conversación.
            </p>
          )}
          {mensajes.map((m) => {
            const esMio = m.de_user_id === user?.id
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
                  {!esMio && (
                    <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, opacity: 0.7 }}>
                      {m.remitente?.name ?? selectedUser?.nombre}
                    </p>
                  )}
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
            style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}
          >
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={`Mensaje a ${selectedUser.nombre}…`}
              style={{
                flex: 1,
                background: 'var(--color-surface2)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                color: 'var(--color-text)',
                padding: '8px 12px',
                fontSize: 13,
                outline: 'none',
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
