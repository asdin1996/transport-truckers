import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { AuthProvider, useAuth } from '../../context/AuthContext'
import * as authService from '../../services/auth'

function TestConsumer() {
  const { user, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="user">{user ? user.name : 'null'}</span>
      <button onClick={() => login('a@b.com', '1234')}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  )
}

beforeEach(() => {
  localStorage.clear()
})

test('user es null cuando no hay token', () => {
  vi.spyOn(authService, 'me').mockResolvedValue({ data: { data: null } })

  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  )

  expect(screen.getByTestId('user').textContent).toBe('null')
})

test('login guarda token y actualiza user', async () => {
  const fakeUser = { id: 1, name: 'Juan', role: 'camionero' }
  vi.spyOn(authService, 'login').mockResolvedValue({
    data: { data: { token: 'tok123', user: fakeUser } },
  })
  vi.spyOn(authService, 'me').mockRejectedValue(new Error('no token'))

  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  )

  await userEvent.click(screen.getByText('login'))

  await waitFor(() => {
    expect(screen.getByTestId('user').textContent).toBe('Juan')
  })
  expect(localStorage.getItem('token')).toBe('tok123')
})

test('logout limpia token y user', async () => {
  localStorage.setItem('token', 'tok123')
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Juan', role: 'camionero' }))

  vi.spyOn(authService, 'me').mockResolvedValue({
    data: { data: { id: 1, name: 'Juan', role: 'camionero' } },
  })
  vi.spyOn(authService, 'logout').mockResolvedValue({})

  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  )

  await waitFor(() => {
    expect(screen.getByTestId('user').textContent).toBe('Juan')
  })

  await userEvent.click(screen.getByText('logout'))

  await waitFor(() => {
    expect(screen.getByTestId('user').textContent).toBe('null')
  })
  expect(localStorage.getItem('token')).toBeNull()
})
