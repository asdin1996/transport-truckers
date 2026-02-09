import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function useRequireAuth(requiredRole = null) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (requiredRole && user.role !== requiredRole) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, requiredRole, navigate])

  return { user, loading }
}
