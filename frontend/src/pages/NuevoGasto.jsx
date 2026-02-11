import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createGasto } from '../services/gastos'

const TIPOS = ['combustible', 'dieta', 'peaje', 'otro']

export default function NuevoGasto() {
  const { id: viajeId } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    tipo: 'combustible',
    importe: '',
    descripcion: '',
    fecha: new Date().toISOString().slice(0, 10),
  })
  const [foto, setFoto] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const fd = new FormData()
    fd.append('viaje_id', viajeId)
    fd.append('tipo', form.tipo)
    fd.append('importe', form.importe)
    fd.append('fecha', form.fecha)
    if (form.descripcion) fd.append('descripcion', form.descripcion)
    if (foto) fd.append('foto_ticket', foto)

    try {
      await createGasto(fd)
      navigate(`/viajes/${viajeId}`)
    } catch (err) {
      const msgs = err.response?.data?.errors
      if (msgs) {
        setError(Object.values(msgs).flat().join(' '))
      } else {
        setError(err.response?.data?.message ?? 'Error al registrar el gasto.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>
            ← Volver
          </button>
          <h2>Añadir gasto</h2>
        </div>
      </div>

      <div className="card">
        {error && <div className="alert alert--error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label htmlFor="tipo">Tipo</label>
            <select id="tipo" value={form.tipo} onChange={set('tipo')}>
              {TIPOS.map((t) => (
                <option key={t} value={t} style={{ textTransform: 'capitalize' }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="importe">Importe (€)</label>
            <input
              id="importe"
              type="number"
              min="0"
              step="0.01"
              value={form.importe}
              onChange={set('importe')}
              required
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label htmlFor="fecha">Fecha</label>
            <input
              id="fecha"
              type="date"
              value={form.fecha}
              onChange={set('fecha')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción (opcional)</label>
            <textarea
              id="descripcion"
              value={form.descripcion}
              onChange={set('descripcion')}
              placeholder="Repostaje en gasolinera km 234…"
            />
          </div>

          <div className="form-group">
            <label htmlFor="foto">Foto del ticket (opcional)</label>
            <input
              id="foto"
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => setFoto(e.target.files[0] ?? null)}
              style={{ padding: '6px 0', background: 'none', border: 'none', color: 'var(--color-text)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
