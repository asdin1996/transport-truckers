import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getMensajesNoLeidos } from '../services/mensajes'
import { useAuth } from './AuthContext'

const MensajesContext = createContext({ total: 0, porUsuario: {}, refresh: () => {} })

export function MensajesProvider({ children }) {
  const { user } = useAuth()
  const [porUsuario, setPorUsuario] = useState({})

  const refresh = useCallback(() => {
    if (!user) return
    getMensajesNoLeidos()
      .then((r) => {
        const counts = {}
        ;(r.data.data ?? []).forEach((m) => {
          counts[m.de_user_id] = (counts[m.de_user_id] ?? 0) + 1
        })
        setPorUsuario(counts)
      })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 15000)
    return () => clearInterval(id)
  }, [refresh])

  const total = Object.values(porUsuario).reduce((a, b) => a + b, 0)

  return (
    <MensajesContext.Provider value={{ total, porUsuario, refresh }}>
      {children}
    </MensajesContext.Provider>
  )
}

export const useMensajes = () => useContext(MensajesContext)
