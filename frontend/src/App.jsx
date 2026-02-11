import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Viajes from './pages/Viajes'
import ViajeDetalle from './pages/ViajeDetalle'
import NuevoGasto from './pages/NuevoGasto'
import './components/layout/Layout.css'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/viajes" element={<Viajes />} />
              <Route path="/viajes/:id" element={<ViajeDetalle />} />
              <Route path="/viajes/:id/gastos/nuevo" element={<NuevoGasto />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
