import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Login from '../../pages/Login'
import { AuthProvider } from '../../context/AuthContext'
import * as authService from '../../services/auth'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(authService, 'me').mockRejectedValue(new Error('no token'))
})

function renderLogin() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

test('muestra formulario de login', () => {
  renderLogin()
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
})

test('muestra error cuando las credenciales son incorrectas', async () => {
  vi.spyOn(authService, 'login').mockRejectedValue({
    response: { data: { message: 'Credenciales incorrectas.' } },
  })

  renderLogin()

  await userEvent.type(screen.getByLabelText(/email/i), 'wrong@test.com')
  await userEvent.type(screen.getByLabelText(/contraseña/i), 'bad')
  await userEvent.click(screen.getByRole('button', { name: /entrar/i }))

  await waitFor(() => {
    expect(screen.getByText('Credenciales incorrectas.')).toBeInTheDocument()
  })
})

test('redirige a dashboard tras login exitoso', async () => {
  vi.spyOn(authService, 'login').mockResolvedValue({
    data: { data: { token: 'tok', user: { id: 1, name: 'Admin', role: 'admin' } } },
  })

  renderLogin()

  await userEvent.type(screen.getByLabelText(/email/i), 'admin@test.com')
  await userEvent.type(screen.getByLabelText(/contraseña/i), 'secret')
  await userEvent.click(screen.getByRole('button', { name: /entrar/i }))

  await waitFor(() => {
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
