import { useEffect, useState } from 'react'
import { getGestores, createGestor, updateGestor, deleteGestor } from '../../../services/gestores'
import { getAlmacenes } from '../../../services/almacenes'
import { useAuth } from '../../../context/AuthContext'
import Pagination from '../../../components/Pagination'
import Modal from '../../../components/Modal'

const PER_PAGE = 10

const ROL_LABELS = { admin: 'Admin', gestor: 'Gestor' }

const FORM_VACIO = { name: '', email: '', password: '', role: 'gestor', almacen_ids: [] }

export default function GestionUsuarios() {
  const { user: yo }                    = useAuth()
  const [usuarios, setUsuarios]         = useState([])
  const [almacenes, setAlmacenes]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [busqueda, setBusqueda]         = useState('')
  const [page, setPage]                 = useState(1)
  const [modal, setModal]               = useState(null)   // null | 'nuevo' | objeto usuario
  const [form, setForm]                 = useState(FORM_VACIO)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState(null)

  const cargar = () =>
    Promise.all([getGestores(), getAlmacenes()])
      .then(([uRes, aRes]) => {
        setUsuarios(uRes.data.data ?? [])
        setAlmacenes(aRes.data.data ?? [])
      })
      .catch(() => setError('Error al cargar los datos.'))
      .finally(() => setLoading(false))

  useEffect(() => { cargar() }, [])

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const toggleAlmacen = (id) => {
    setForm((p) => ({
      ...p,
      almacen_ids: p.almacen_ids.includes(id)
        ? p.almacen_ids.filter((x) => x !== id)
        : [...p.almacen_ids, id],
    }))
  }

  const abrirNuevo = () => {
    setForm(FORM_VACIO); setError(null); setModal('nuevo')
  }

  const abrirEditar = (u) => {
    setForm({
      name:        u.name,
      email:       u.email,
      password:    '',
      role:        u.role,
      almacen_ids: u.almacenes.map((a) => a.id),
    })
    setError(null)
    setModal(u)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password

      if (modal === 'nuevo') {
        await createGestor(payload)
      } else {
        await updateGestor(modal.id, payload)
      }
      setModal(null); cargar()
    } catch (err) {
      const msgs = err.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat().join(' ') : 'Error al guardar.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (u) => {
    if (!confirm(`¿Eliminar el usuario ${u.name}?`)) return
    try {
      await deleteGestor(u.id)
      setUsuarios((prev) => prev.filter((x) => x.id !== u.id))
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al eliminar.')
    }
  }

  const filtrados = usuarios.filter((u) =>
    u.name.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  )
  const doSearch = (q) => { setBusqueda(q); setPage(1) }
  const lista = filtrados.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const esNuevo = modal === 'nuevo'

  return (
    <div>
      <div className="page-header">
        <h2>Gestión de usuarios</h2>
        <button className="btn btn--primary" onClick={abrirNuevo} style={{ fontSize: 15, padding: '10px 24px', fontWeight: 600 }}>
          + Nuevo usuario
        </button>
      </div>

      {error && !modal && <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="card">
        <div className="table-controls">
          <div className="table-search">
            <span className="table-search__icon">⌕</span>
            <input type="text" placeholder="Buscar usuario…" value={busqueda} onChange={(e) => doSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando…</p>
        ) : filtrados.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: '8px 0' }}>
            {busqueda ? 'Sin resultados.' : 'Sin usuarios registrados.'}
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Almacenes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{u.email}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        padding: '2px 8px', borderRadius: 4,
                        background: u.role === 'admin' ? 'rgba(186,53,52,0.12)' : 'rgba(33,150,243,0.12)',
                        color:      u.role === 'admin' ? '#ba3534'              : '#64b5f6',
                      }}>
                        {ROL_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {u.almacenes.length === 0
                        ? <span style={{ color: 'var(--color-text-muted)' }}>Todos (sin filtro)</span>
                        : u.almacenes.map((a) => a.nombre).join(', ')
                      }
                    </td>
                    <td style={{ textAlign: 'right', width: 140 }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn--ghost btn--sm" onClick={() => abrirEditar(u)}>Editar</button>
                        {u.id !== yo?.id && (
                          <button className="btn btn--danger btn--sm" onClick={() => handleDelete(u)}>Eliminar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} total={filtrados.length} perPage={PER_PAGE} onChange={setPage} />
          </div>
        )}
      </div>

      {modal !== null && (
        <Modal onClose={() => setModal(null)} maxWidth={520}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>{esNuevo ? 'Nuevo usuario' : 'Editar usuario'}</h3>
            <button className="btn btn--ghost btn--sm" onClick={() => setModal(null)}>✕</button>
          </div>

          {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div className="form-row">
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" value={form.name} onChange={set('name')} placeholder="Nombre completo" autoFocus />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select value={form.role} onChange={set('role')}>
                  <option value="gestor">Gestor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="correo@empresa.com" />
            </div>

            <div className="form-group">
              <label>{esNuevo ? 'Contraseña' : 'Nueva contraseña'} {!esNuevo && <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(dejar vacío para no cambiar)</span>}</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Mínimo 8 caracteres" />
            </div>

            <div className="form-group">
              <label>Almacenes asignados <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(vacío = acceso total)</span></label>
              {almacenes.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No hay almacenes creados todavía.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {almacenes.map((a) => {
                    const activo = form.almacen_ids.includes(a.id)
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAlmacen(a.id)}
                        style={{
                          padding: '5px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                          border: `1px solid ${activo ? 'var(--color-primary)' : '#444'}`,
                          background: activo ? 'rgba(186,53,52,0.15)' : 'transparent',
                          color: activo ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          fontWeight: activo ? 600 : 400,
                          transition: 'all 0.15s',
                        }}
                      >
                        {a.nombre}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="button" className="btn btn--ghost" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className="btn btn--primary" disabled={saving || !form.name.trim() || !form.email.trim() || (esNuevo && !form.password)}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
