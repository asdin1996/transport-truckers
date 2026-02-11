import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import NuevoGasto from '../../pages/NuevoGasto'
import { AuthProvider } from '../../context/AuthContext'
import * as gastosService from '../../services/gastos'
import * as authService from '../../services/auth'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(authService, 'me').mockRejectedValue(new Error())
})

function renderNuevoGasto() {
  render(
    <MemoryRouter initialEntries={['/viajes/1/gastos/nuevo']}>
      <AuthProvider>
        <Routes>
          <Route path="/viajes/:id/gastos/nuevo" element={<NuevoGasto />} />
          <Route path="/viajes/:id" element={<div>Detalle viaje</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

test('renderiza el formulario con campos requeridos', () => {
  renderNuevoGasto()
  expect(screen.getByLabelText(/tipo/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/importe/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument()
})

test('envía el formulario y redirige al detalle del viaje', async () => {
  vi.spyOn(gastosService, 'createGasto').mockResolvedValue({ data: { data: {} } })

  renderNuevoGasto()

  await userEvent.clear(screen.getByLabelText(/importe/i))
  await userEvent.type(screen.getByLabelText(/importe/i), '45.50')

  await userEvent.click(screen.getByRole('button', { name: /guardar gasto/i }))

  await waitFor(() => {
    expect(screen.getByText('Detalle viaje')).toBeInTheDocument()
  })
  expect(gastosService.createGasto).toHaveBeenCalledOnce()
})

test('muestra error de validación si la API rechaza la petición', async () => {
  vi.spyOn(gastosService, 'createGasto').mockRejectedValue({
    response: { data: { errors: { importe: ['El importe es obligatorio.'] } } },
  })

  renderNuevoGasto()

  // Rellenar importe para que el formulario pase la validación nativa de jsdom
  await userEvent.type(screen.getByLabelText(/importe/i), '10')
  await userEvent.click(screen.getByRole('button', { name: /guardar gasto/i }))

  await waitFor(() => {
    expect(screen.getByText('El importe es obligatorio.')).toBeInTheDocument()
  })
})
