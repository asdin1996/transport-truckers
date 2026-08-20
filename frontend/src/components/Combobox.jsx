import { useEffect, useRef, useState } from 'react'

// options: string[] | { value, label }[]
// value: valor seleccionado
// onChange(value): recibe el value seleccionado
export default function Combobox({ value, onChange, options = [], placeholder = 'Buscar…' }) {
  const normalize = (o) => typeof o === 'string' ? { value: o, label: o } : o

  const normalized = options.map(normalize)
  const selected   = normalized.find((o) => o.value === value)

  const [query,     setQuery]     = useState(selected?.label ?? '')
  const [open,      setOpen]      = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)

  const containerRef = useRef(null)
  const itemRefs     = useRef([])

  // Sincronizar texto cuando cambia el value desde fuera
  useEffect(() => {
    setQuery(selected?.label ?? (value ?? ''))
  }, [value])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const close = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setActiveIdx(-1)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const filtered = normalized
    .filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 60)

  const select = (opt) => {
    setQuery(opt.label)
    onChange(opt.value)
    setOpen(false)
    setActiveIdx(-1)
  }

  const scrollToItem = (idx) => {
    itemRefs.current[idx]?.scrollIntoView({ block: 'nearest' })
  }

  const handleChange = (e) => {
    setQuery(e.target.value)
    onChange(e.target.value)
    setOpen(true)
    setActiveIdx(-1)
  }

  const handleKeyDown = (e) => {
    // Abrir con flecha abajo si estaba cerrado
    if (!open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
        setActiveIdx(0)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        const next = Math.min(activeIdx + 1, filtered.length - 1)
        setActiveIdx(next)
        scrollToItem(next)
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        const prev = Math.max(activeIdx - 1, 0)
        setActiveIdx(prev)
        scrollToItem(prev)
        break
      }
      case 'Enter': {
        // Si hay un item resaltado, seleccionarlo
        if (activeIdx >= 0 && filtered[activeIdx]) {
          e.preventDefault()
          select(filtered[activeIdx])
        } else if (filtered.length === 1) {
          // Si solo hay un resultado, seleccionarlo directamente
          e.preventDefault()
          select(filtered[0])
        } else {
          // Cerrar el desplegable pero NO seleccionar — el formulario
          // solo se enviará si hay un valor limpio ya seleccionado
          setOpen(false)
          setActiveIdx(-1)
          // Si el texto no coincide exactamente con ninguna opción,
          // buscar coincidencia exacta (case-insensitive) y seleccionar
          const exact = normalized.find(
            (o) => o.label.toLowerCase() === query.trim().toLowerCase()
          )
          if (exact) select(exact)
        }
        break
      }
      case 'Escape': {
        setOpen(false)
        setActiveIdx(-1)
        // Revertir al valor seleccionado previo
        setQuery(selected?.label ?? '')
        if (selected) onChange(selected.value)
        break
      }
      default:
        break
    }
  }

  // Al salir del campo: si lo escrito no coincide exactamente, revertir
  const handleBlur = () => {
    setTimeout(() => {
      if (containerRef.current?.contains(document.activeElement)) return
      const exact = normalized.find(
        (o) => o.label.toLowerCase() === query.trim().toLowerCase()
      )
      if (exact) {
        select(exact)
      } else if (selected) {
        // Revertir al último valor válido
        setQuery(selected.label)
      }
      setOpen(false)
      setActiveIdx(-1)
    }, 150)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => { setOpen(true); setActiveIdx(-1) }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
      />

      {open && filtered.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          zIndex: 200,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
          margin: 0,
          padding: '4px 0',
          listStyle: 'none',
          maxHeight: 260,
          overflowY: 'auto',
        }}>
          {filtered.map((opt, i) => {
            const isActive   = i === activeIdx
            const isSelected = opt.value === value
            return (
              <li
                key={opt.value}
                ref={(el) => { itemRefs.current[i] = el }}
                // mouseDown con preventDefault evita que el input pierda el foco
                onMouseDown={(e) => { e.preventDefault(); select(opt) }}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: 13,
                  background: isActive   ? 'var(--color-surface2)' : 'transparent',
                  color:      isSelected ? 'var(--color-primary)'  : 'var(--color-text)',
                  fontWeight: isSelected ? 600 : 400,
                  borderLeft: isActive
                    ? '2px solid var(--color-primary)'
                    : '2px solid transparent',
                  transition: 'background 0.1s',
                }}
              >
                {opt.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
