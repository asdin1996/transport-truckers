import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Bienvenido, {user?.name}</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Panel de control — próximamente con estadísticas y resúmenes.
      </p>
    </div>
  )
}
