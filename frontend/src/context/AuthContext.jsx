import { createContext, useContext, useEffect, useState } from 'react'
import { login as apiLogin, logout as apiLogout, me } from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    me()
      .then((res) => {
        setUser(res.data.data)
        localStorage.setItem('user', JSON.stringify(res.data.data))
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await apiLogin(email, password)
    const { token, user: userData } = res.data.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = async () => {
    try {
      await apiLogout()
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  const isAdmin = () => user?.role === 'admin'
  const isCamionero = () => user?.role === 'camionero'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isCamionero }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
