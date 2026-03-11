import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Camioneros from '../../pages/admin/Camioneros'
import { AuthProvider } from '../../context/AuthContext'
import * as caminerosService from '../../services/camioneros'
import * as authService from '../../services/auth'

const CAMIONEROS = [
  { id: 1, nombre: 'Juan', apellidos: 'García', email: 'juan@test.com', telefono: '600000001', dni: '12345678A' },
  { id: 2, nombre: 'Pedro', apellidos: 'López', email: 'pedro@test.com', telefono: null, dni: '87654321B' },
]

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(authService, 'me').mockRejectedValue(new Error())
  vi.spyOn(caminerosService, 'getCamioneros').mockResolvedValue({ data: { data: CAMIONEROS } })
})

function renderCamioneros() {
  render(
    <MemoryRouter initialEntries={['/camioneros']}>
      <AuthProvider>
        <Routes>
          <Route path="/camioneros" element={<Camioneros />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

test('muestra la lista de camioneros', async () => {
  renderCamioneros()
  await waitFor(() => {
    expect(screen.getByText('Juan García')).toBeInTheDocument()
    expect(screen.getByText('Pedro López')).toBeInTheDocument()
  })
})

test('abre el modal al hacer clic en Nuevo camionero', async () => {
  renderCamioneros()
  await waitFor(() => screen.getByText('Juan García'))

  await userEvent.click(screen.getByRole('button', { name: /nuevo camionero/i }))

  expect(screen.getByText('Nuevo camionero')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument()
})

test('cierra el modal al hacer clic en Cancelar', async () => {
  renderCamioneros()
  await waitFor(() => screen.getByText('Juan García'))

  await userEvent.click(screen.getByRole('button', { name: /nuevo camionero/i }))
  await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))

  expect(screen.queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument()
})

test('crea un camionero y recarga la lista', async () => {
  vi.spyOn(caminerosService, 'createCamionero').mockResolvedValue({ data: { data: {} } })

  renderCamioneros()
  await waitFor(() => screen.getByText('Juan García'))

  await userEvent.click(screen.getByRole('button', { name: /nuevo camionero/i }))

  const modal = screen.getByText('Nuevo camionero').closest('.modal')
  const inputs = within(modal).getAllByRole('textbox')
  await userEvent.type(inputs[0], 'Ana')       // Nombre
  await userEvent.type(inputs[1], 'Martínez')  // Apellidos
  await userEvent.type(inputs[2], 'ana@test.com') // Email
  await userEvent.type(inputs[4], '12345678A') // DNI

  await userEvent.click(screen.getByRole('button', { name: /guardar/i }))

  await waitFor(() => {
    expect(caminerosService.createCamionero).toHaveBeenCalledOnce()
    // Llamado al menos 2 veces: carga inicial + recarga tras guardar
    expect(caminerosService.getCamioneros.mock.calls.length).toBeGreaterThanOrEqual(2)
  })
})

test('elimina un camionero tras confirmar', async () => {
  vi.spyOn(caminerosService, 'deleteCamionero').mockResolvedValue({})
  vi.spyOn(window, 'confirm').mockReturnValue(true)

  renderCamioneros()
  await waitFor(() => screen.getByText('Juan García'))

  const botonesEliminar = screen.getAllByRole('button', { name: /eliminar/i })
  await userEvent.click(botonesEliminar[0])

  await waitFor(() => {
    expect(screen.queryByText('Juan García')).not.toBeInTheDocument()
  })
})
