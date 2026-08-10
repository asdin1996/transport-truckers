import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './pages/Login'
import DashboardRouter from './pages/DashboardRouter'
import Viajes from './pages/Viajes'
import ViajeDetalle from './pages/ViajeDetalle'
import Mensajes from './pages/Mensajes'
import Camioneros from './pages/admin/Camioneros'
import Vehiculos from './pages/admin/Vehiculos'
import MapaGps from './pages/admin/MapaGps'
import Paradas from './pages/admin/configuracion/Paradas'
import MaponConfig from './pages/admin/configuracion/Mapon'
import TiposMaterial from './pages/admin/configuracion/TiposMaterial'
import Almacenes from './pages/admin/configuracion/Almacenes'
import GestionUsuarios from './pages/admin/configuracion/GestionUsuarios'
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
              <Route path="/viajes/:id" element={<ViajeDetalle />} />
              <Route path="/camioneros" element={<Camioneros />} />
              <Route path="/vehiculos" element={<Vehiculos />} />
              <Route path="/mensajes" element={<Mensajes />} />
              <Route path="/mapa" element={<MapaGps />} />
              <Route path="/configuracion/paradas"          element={<Paradas />} />
              <Route path="/configuracion/mapon"            element={<MaponConfig />} />
              <Route path="/configuracion/tipos-material"   element={<TiposMaterial />} />
              <Route path="/configuracion/almacenes"        element={<Almacenes />} />
              <Route path="/configuracion/usuarios"         element={<GestionUsuarios />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
