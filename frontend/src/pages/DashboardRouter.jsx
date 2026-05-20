import { useAuth } from '../context/AuthContext'
import Dashboard from './Dashboard'
import DashboardAdmin from './admin/DashboardAdmin'
import DashboardMaps from './DashboardMaps'

export default function DashboardRouter() {
  const { isAdmin, isMaps } = useAuth()
  if (isAdmin()) return <DashboardAdmin />
  if (isMaps())  return <DashboardMaps />
  return <Dashboard />
}
