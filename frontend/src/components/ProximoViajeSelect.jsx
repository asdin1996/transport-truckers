import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function ProximoViajeSelect({ value, options = [], onChange, disabled, placeholder = '— Sin próximo viaje —' }) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos]     = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)
  const inputRef   = useRef(null)

  // eslint-disable-next-line eqeqeq
  const selected = options.find((o) => o.value == value)

  const calcPos = () => {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 4, left: r.left, width: r.width })
  }

  const handleToggle = () => {
    if (!open) calcPos()
    setOpen((o) => !o)
  }

  useEffect(() => {
    const close = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
    }
  }, [open])

  // Recalcular posición si el usuario hace scroll con el dropdown abierto
  useEffect(() => {
    if (!open) return
    const onScroll = () => calcPos()
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [open])

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    (o.fecha ?? '').includes(query)
  )

  const select = (opt) => {
    onChange(opt?.value ?? null)
    setOpen(false)
    setQuery('')
  }

  return (
    <div style={{ position: 'relative' }}>

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          background: open ? 'var(--color-surface2)' : 'var(--color-surface)',
          border: `1px solid ${open ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: 6,
          padding: '7px 10px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'border-color 0.15s',
          textAlign: 'left',
          minWidth: 0,
        }}
      >
        <span style={{ minWidth: 0, overflow: 'hidden' }}>
          {selected ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--color-text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selected.label}
              </span>
              {selected.fecha && (
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{selected.fecha}</span>
              )}
            </>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{placeholder}</span>
          )}
        </span>
        <span style={{
          fontSize: 10,
          color: 'var(--color-text-muted)',
          flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s',
        }}>▼</span>
      </button>

      {/* Dropdown — portaled al body para escapar de overflow:auto */}
      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: Math.max(pos.width, 260),
            zIndex: 9000,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}
        >
          {/* Search */}
          <div style={{
            padding: '8px 10px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface2)',
          }}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                fontSize: 14, color: 'var(--color-text-muted)', pointerEvents: 'none',
              }}>⌕</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar…"
                style={{
                  width: '100%',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 5,
                  color: 'var(--color-text)',
                  fontSize: 12,
                  padding: '5px 8px 5px 26px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Options */}
          <ul style={{
            margin: 0, padding: '4px 0',
            listStyle: 'none',
            maxHeight: 260,
            overflowY: 'auto',
          }}>
            {/* Opción limpiar */}
            <li
              onMouseDown={() => select(null)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--color-text-muted)',
                borderBottom: '1px solid var(--color-border)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              {placeholder}
            </li>

            {filtered.length === 0 && (
              <li style={{ padding: '12px', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                Sin resultados
              </li>
            )}

            {filtered.map((opt) => {
              // eslint-disable-next-line eqeqeq
              const isSelected = opt.value == value
              return (
                <li
                  key={opt.value}
                  onMouseDown={() => select(opt)}
                  style={{
                    padding: '9px 12px',
                    cursor: 'pointer',
                    borderLeft: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent',
                    background: isSelected ? 'rgba(186,53,52,0.06)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--color-surface2)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'rgba(186,53,52,0.06)' : 'transparent' }}
                >
                  <div style={{ fontSize: 13, color: isSelected ? 'var(--color-primary)' : 'var(--color-text)', fontWeight: isSelected ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opt.label}
                  </div>
                  {opt.fecha && (
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
                      {opt.fecha}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>,
        document.body
      )}
    </div>
  )
}
