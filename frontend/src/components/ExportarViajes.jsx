import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import DatePicker, { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale/es'
import 'react-datepicker/dist/react-datepicker.css'
import Modal from './Modal'
import Combobox from './Combobox'
import { getCamioneros } from '../services/camioneros'
import { getVehiculos } from '../services/vehiculos'
import { getParadas } from '../services/paradas'

registerLocale('es', es)

const ESTADO_LABELS = {
  pendiente:       'Pendiente',
  en_camino:       'En camino',
  llegada_destino: 'Llegada a destino',
  cargando:        'Cargando',
  descargando:     'Descargando',
  finalizado:      'Finalizado',
  cancelado:       'Cancelado',
}

const ESTADOS = Object.keys(ESTADO_LABELS)

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.07em', color: 'var(--color-text-muted)',
      margin: '4px 0 -4px',
    }}>
      {children}
    </p>
  )
}

export default function ExportarViajes({ viajes, onClose }) {
  const [opts, setOpts]     = useState({ camioneros: [], vehiculos: [], paradas: [] })
  const [loading, setLoading] = useState(true)

  const [filtros, setFiltros] = useState({
    fechaDesde:   null,
    fechaHasta:   null,
    camionero_id: '',
    vehiculo_id:  '',
    origen:       '',
    destino:      '',
    estado:       '',
  })

  const set = (f) => (e) => setFiltros((p) => ({ ...p, [f]: e.target.value }))

  useEffect(() => {
    Promise.all([getCamioneros(), getVehiculos(), getParadas()])
      .then(([cRes, vRes, pRes]) => setOpts({
        camioneros: cRes.data.data ?? [],
        vehiculos:  vRes.data.data ?? [],
        paradas:    pRes.data.data ?? [],
      }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const aplicarFiltros = (lista) => {
    return lista.filter((v) => {
      if ((filtros.fechaDesde || filtros.fechaHasta) && !v.fecha_inicio) return false
      if (filtros.fechaDesde && new Date(v.fecha_inicio) < filtros.fechaDesde) return false
      if (filtros.fechaHasta) {
        const hasta = new Date(filtros.fechaHasta); hasta.setHours(23, 59, 59)
        if (new Date(v.fecha_inicio) > hasta) return false
      }
      // eslint-disable-next-line eqeqeq
      if (filtros.camionero_id && v.camionero_id != filtros.camionero_id) return false
      // eslint-disable-next-line eqeqeq
      if (filtros.vehiculo_id  && v.vehiculo_id  != filtros.vehiculo_id)  return false
      if (filtros.origen && !(v.origen  ?? '').toLowerCase().includes(filtros.origen.toLowerCase()))  return false
      if (filtros.destino && !(v.destino ?? '').toLowerCase().includes(filtros.destino.toLowerCase())) return false
      if (filtros.estado && v.estado !== filtros.estado) return false
      return true
    })
  }

  const resultado = aplicarFiltros(viajes)

  const exportar = () => {
    const filas = resultado.map((v) => ({
      'ID':             v.id,
      'Estado':         ESTADO_LABELS[v.estado] ?? v.estado,
      'Tipo':           v.tipo ? v.tipo.charAt(0).toUpperCase() + v.tipo.slice(1) : '',
      'Origen':         v.origen  ?? '',
      'Destino':        v.destino ?? '',
      'Camionero':      v.camionero ? `${v.camionero.nombre} ${v.camionero.apellidos}` : '',
      'Vehículo':       v.vehiculo  ? `${v.vehiculo.matricula} · ${v.vehiculo.marca} ${v.vehiculo.modelo}` : '',
      'Fecha inicio':   v.fecha_inicio ?? '',
      'Fecha fin':      v.fecha_fin    ?? '',
      'Inicio real':    v.hora_inicio  ? new Date(v.hora_inicio).toLocaleString('es-ES') : '',
      'Fin real':       v.hora_fin     ? new Date(v.hora_fin).toLocaleString('es-ES')    : '',
      'Duración': (() => {
        if (!v.duracion_minutos) return ''
        const h = Math.floor(v.duracion_minutos / 60)
        const m = v.duracion_minutos % 60
        if (h > 0 && m > 0) return `${h}h ${String(m).padStart(2, '0')}min`
        if (h > 0)          return `${h}h`
        return `${m} min`
      })(),
      'Notas':          v.notas ?? '',
    }))

    const ws = XLSX.utils.json_to_sheet(filas)

    // Ancho de columnas automático
    const colWidths = Object.keys(filas[0] ?? {}).map((key) => ({
      wch: Math.max(key.length, ...filas.map((r) => String(r[key] ?? '').length)) + 2,
    }))
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Viajes')

    const fecha = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `viajes_${fecha}.xlsx`)
    onClose()
  }

  return (
    <Modal onClose={onClose} maxWidth={640}>
      <div className="modal__header">
        <div>
          <h3 style={{ margin: 0, fontSize: 18 }}>Exportar viajes</h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
            Aplica filtros y descarga el reporte en Excel
          </p>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={onClose}>✕</button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <SectionLabel>Rango de fechas</SectionLabel>
          <div className="form-row">
            <div className="form-group">
              <label>Desde</label>
              <DatePicker
                locale="es"
                selected={filtros.fechaDesde}
                onChange={(date) => setFiltros((p) => ({ ...p, fechaDesde: date }))}
                selectsStart
                startDate={filtros.fechaDesde}
                endDate={filtros.fechaHasta}
                dateFormat="dd/MM/yyyy"
                placeholderText="Seleccionar fecha…"
                isClearable
                className="datepicker-input"
                calendarClassName="datepicker-calendar"
              />
            </div>
            <div className="form-group">
              <label>Hasta</label>
              <DatePicker
                locale="es"
                selected={filtros.fechaHasta}
                onChange={(date) => setFiltros((p) => ({ ...p, fechaHasta: date }))}
                selectsEnd
                startDate={filtros.fechaDesde}
                endDate={filtros.fechaHasta}
                minDate={filtros.fechaDesde}
                dateFormat="dd/MM/yyyy"
                placeholderText="Seleccionar fecha…"
                isClearable
                className="datepicker-input"
                calendarClassName="datepicker-calendar"
              />
            </div>
          </div>

          <SectionLabel>Viaje</SectionLabel>
          <div className="form-row">
            <div className="form-group">
              <label>Origen</label>
              <Combobox
                value={filtros.origen}
                onChange={(v) => setFiltros((p) => ({ ...p, origen: v }))}
                options={opts.paradas.map((p) => p.nombre)}
                placeholder="Todos los orígenes…"
              />
            </div>
            <div className="form-group">
              <label>Destino</label>
              <Combobox
                value={filtros.destino}
                onChange={(v) => setFiltros((p) => ({ ...p, destino: v }))}
                options={opts.paradas.map((p) => p.nombre)}
                placeholder="Todos los destinos…"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Estado</label>
              <select value={filtros.estado} onChange={set('estado')}>
                <option value="">Todos los estados</option>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>{ESTADO_LABELS[e]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Vehículo</label>
              <select value={filtros.vehiculo_id} onChange={set('vehiculo_id')}>
                <option value="">Todos</option>
                {opts.vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>{v.matricula} — {v.marca} {v.modelo}</option>
                ))}
              </select>
            </div>
          </div>

          <SectionLabel>Asignación</SectionLabel>
          <div className="form-group">
            <label>Camionero</label>
            <select value={filtros.camionero_id} onChange={set('camionero_id')}>
              <option value="">Todos los camioneros</option>
              {opts.camioneros.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} {c.apellidos}</option>
              ))}
            </select>
          </div>

          {/* Previsualización */}
          <div style={{
            background: 'var(--color-surface2)',
            borderRadius: 8,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Registros que se exportarán
            </span>
            <span style={{ fontSize: 22, fontWeight: 700, color: resultado.length > 0 ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
              {resultado.length}
            </span>
          </div>

          <div style={{
            display: 'flex', gap: 10, justifyContent: 'flex-end',
            paddingTop: 8, borderTop: '1px solid var(--color-border)', marginTop: 4,
          }}>
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={resultado.length === 0}
              onClick={exportar}
              style={{ fontSize: 15, padding: '10px 24px', fontWeight: 600 }}
            >
              Exportar {resultado.length > 0 ? `(${resultado.length})` : ''}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
