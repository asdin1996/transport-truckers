import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Viajes from '../../pages/Viajes'
import { AuthProvider } from '../../context/AuthContext'
import * as viajesService from '../../services/viajes'
import * as authService from '../../services/auth'

const VIAJES = [
  {
    id: 1,
    estado: 'en_curso',
    ruta: { origen: 'Madrid', destino: 'Barcelona', km_estimados: 620 },
    vehiculo: { matricula: '1234ABC' },
    fecha_inicio: '2026-04-01T08:00:00Z',
    fecha_fin: null,
  },
  {
    id: 2,
    estado: 'pendiente',
    ruta: { origen: 'Valencia', destino: 'Bilbao', km_estimados: 490 },
    vehiculo: { matricula: '5678DEF' },
    fecha_inicio: null,
    fecha_fin: null,
  },
  {
    id: 3,
    estado: 'completado',
    ruta: { origen: 'Sevilla', destino: 'Madrid', km_estimados: 540 },
    vehiculo: { matricula: '9999GHI' },
    fecha_inicio: '2026-03-01T08:00:00Z',
    fecha_fin: '2026-03-02T18:00:00Z',
  },
]

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(authService, 'me').mockRejectedValue(new Error())
  vi.spyOn(viajesService, 'getViajes').mockResolvedValue({ data: { data: VIAJES } })
})

function renderViajes() {
  render(
    <MemoryRouter initialEntries={['/viajes']}>
      <AuthProvider>
        <Routes>
          <Route path="/viajes" element={<Viajes />} />
          <Route path="/viajes/:id" element={<div>Detalle</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

test('muestra todos los viajes por defecto', async () => {
  renderViajes()
  await waitFor(() => {
    expect(screen.getByText('Madrid → Barcelona')).toBeInTheDocument()
    expect(screen.getByText('Valencia → Bilbao')).toBeInTheDocument()
    expect(screen.getByText('Sevilla → Madrid')).toBeInTheDocument()
  })
})

test('filtra por estado en_curso', async () => {
  renderViajes()
  await waitFor(() => screen.getByText('Madrid → Barcelona'))

  // El botón del filtro "En curso" (hay varios textos "En curso" en la página: tab + badge)
  const filterButtons = screen.getAllByRole('button')
  const btnEnCurso = filterButtons.find((b) => b.textContent === 'En curso')
  await userEvent.click(btnEnCurso)

  expect(screen.getByText('Madrid → Barcelona')).toBeInTheDocument()
  expect(screen.queryByText('Valencia → Bilbao')).not.toBeInTheDocument()
  expect(screen.queryByText('Sevilla → Madrid')).not.toBeInTheDocument()
})

test('muestra badge de estado correcto', async () => {
  renderViajes()
  await waitFor(() => screen.getAllByText('En curso'))
  // Hay al menos un badge "Pendiente" y uno "Completado" en la tabla
  expect(screen.getAllByText('Pendiente').length).toBeGreaterThanOrEqual(1)
  expect(screen.getAllByText('Completado').length).toBeGreaterThanOrEqual(1)
})

test('muestra error si la API falla', async () => {
  vi.spyOn(viajesService, 'getViajes').mockRejectedValue(new Error('API error'))
  renderViajes()
  await waitFor(() => {
    expect(screen.getByText('Error al cargar los viajes.')).toBeInTheDocument()
  })
})
