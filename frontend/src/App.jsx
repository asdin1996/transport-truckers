import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './pages/Login'
import DashboardRouter from './pages/DashboardRouter'
import Viajes from './pages/Viajes'
import ViajeDetalle from './pages/ViajeDetalle'
import NuevoGasto from './pages/NuevoGasto'
import Camioneros from './pages/admin/Camioneros'
import Vehiculos from './pages/admin/Vehiculos'
import NuevoViaje from './pages/admin/NuevoViaje'
import MapaGps from './pages/admin/MapaGps'
import './components/layout/Layout.css'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardRouter />} />
              <Route path="/viajes" element={<Viajes />} />
              {/* /viajes/nuevo debe ir ANTES de /viajes/:id */}
              <Route path="/viajes/nuevo" element={<NuevoViaje />} />
              <Route path="/viajes/:id" element={<ViajeDetalle />} />
              <Route path="/viajes/:id/gastos/nuevo" element={<NuevoGasto />} />
              <Route path="/camioneros" element={<Camioneros />} />
              <Route path="/vehiculos" element={<Vehiculos />} />
              <Route path="/mapa" element={<MapaGps />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
