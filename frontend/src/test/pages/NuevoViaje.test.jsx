import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import NuevoViaje from '../../pages/admin/NuevoViaje'
import { AuthProvider } from '../../context/AuthContext'
import * as caminerosService from '../../services/camioneros'
import * as vehiculosService from '../../services/vehiculos'
import * as rutasService from '../../services/rutas'
import * as viajesService from '../../services/viajes'
import * as authService from '../../services/auth'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(authService, 'me').mockRejectedValue(new Error())
  vi.spyOn(caminerosService, 'getCamioneros').mockResolvedValue({
    data: { data: [{ id: 1, nombre: 'Juan', apellidos: 'García' }] },
  })
  vi.spyOn(vehiculosService, 'getVehiculos').mockResolvedValue({
    data: { data: [{ id: 1, matricula: '1234ABC', marca: 'Volvo', modelo: 'FH' }] },
  })
  vi.spyOn(rutasService, 'getRutas').mockResolvedValue({
    data: { data: [{ id: 1, origen: 'Madrid', destino: 'Barcelona', km_estimados: 620 }] },
  })
})

function renderNuevoViaje() {
  render(
    <MemoryRouter initialEntries={['/viajes/nuevo']}>
      <AuthProvider>
        <Routes>
          <Route path="/viajes/nuevo" element={<NuevoViaje />} />
          <Route path="/viajes" element={<div>Lista viajes</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

test('carga los selectores con datos de la API', async () => {
  renderNuevoViaje()
  await waitFor(() => {
    expect(screen.getByText('Juan García')).toBeInTheDocument()
    expect(screen.getByText('1234ABC — Volvo FH')).toBeInTheDocument()
    expect(screen.getByText('Madrid → Barcelona (620 km)')).toBeInTheDocument()
  })
})

test('crea el viaje y redirige a la lista', async () => {
  vi.spyOn(viajesService, 'createViaje').mockResolvedValue({ data: { data: { id: 99 } } })

  renderNuevoViaje()
  await waitFor(() => screen.getByText('Juan García'))

  await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '1')
  await userEvent.selectOptions(screen.getAllByRole('combobox')[1], '1')
  await userEvent.selectOptions(screen.getAllByRole('combobox')[2], '1')

  await userEvent.click(screen.getByRole('button', { name: /crear viaje/i }))

  await waitFor(() => {
    expect(viajesService.createViaje).toHaveBeenCalledOnce()
    expect(screen.getByText('Lista viajes')).toBeInTheDocument()
  })
})

test('muestra error si la API rechaza el formulario', async () => {
  vi.spyOn(viajesService, 'createViaje').mockRejectedValue({
    response: { data: { errors: { camionero_id: ['El camionero es obligatorio.'] } } },
  })

  renderNuevoViaje()
  await waitFor(() => screen.getByText('Juan García'))

  await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '1')
  await userEvent.selectOptions(screen.getAllByRole('combobox')[1], '1')
  await userEvent.selectOptions(screen.getAllByRole('combobox')[2], '1')

  await userEvent.click(screen.getByRole('button', { name: /crear viaje/i }))

  await waitFor(() => {
    expect(screen.getByText('El camionero es obligatorio.')).toBeInTheDocument()
  })
})
