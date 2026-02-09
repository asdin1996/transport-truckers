import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ role = null }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span style={{ color: 'var(--color-text-muted)' }}>Cargando…</span>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
