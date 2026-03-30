import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getResumenMensajes } from '../services/mensajes'
import { useAuth } from './AuthContext'

// resumen: { [contactId]: { no_leidos, ultimo_mensaje_at } }
const MensajesContext = createContext({ total: 0, resumen: {}, refresh: () => {} })

export function MensajesProvider({ children }) {
  const { user } = useAuth()
  const [resumen, setResumen] = useState({})

  const refresh = useCallback(() => {
    if (!user) return
    getResumenMensajes()
      .then((r) => {
        const map = {}
        ;(r.data.data ?? []).forEach((item) => {
          map[item.contact_id] = {
            no_leidos:         Number(item.no_leidos) || 0,
            ultimo_mensaje_at: item.ultimo_mensaje_at,
          }
        })
        setResumen(map)
      })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 15000)
    return () => clearInterval(id)
  }, [refresh])

  const total = Object.values(resumen).reduce((acc, v) => acc + (v.no_leidos ?? 0), 0)

  return (
    <MensajesContext.Provider value={{ total, resumen, refresh }}>
      {children}
    </MensajesContext.Provider>
  )
}

export const useMensajes = () => useContext(MensajesContext)
