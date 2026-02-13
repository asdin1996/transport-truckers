import { useAuth } from '../context/AuthContext'
import Dashboard from './Dashboard'
import DashboardAdmin from './admin/DashboardAdmin'

export default function DashboardRouter() {
  const { isAdmin } = useAuth()
  return isAdmin() ? <DashboardAdmin /> : <Dashboard />
}
