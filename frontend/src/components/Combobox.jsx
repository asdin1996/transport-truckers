import { useEffect, useRef, useState } from 'react'

export default function Combobox({ value, onChange, options = [], placeholder = 'Buscar…' }) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState(value ?? '')
  const ref = useRef(null)

  useEffect(() => { setQuery(value ?? '') }, [value])

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const filtered = options
    .filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 25)

  const select = (val) => { setQuery(val); onChange(val); setOpen(false) }

  const handleChange = (e) => {
    setQuery(e.target.value)
    onChange(e.target.value)
    setOpen(true)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: 'calc(100% + 2px)',
          left: 0,
          right: 0,
          zIndex: 200,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
          margin: 0,
          padding: '4px 0',
          listStyle: 'none',
          maxHeight: 220,
          overflowY: 'auto',
        }}>
          {filtered.map((opt) => (
            <li
              key={opt}
              onMouseDown={() => select(opt)}
              style={{
                padding: '8px 14px',
                cursor: 'pointer',
                fontSize: 13,
                color: opt === value ? 'var(--color-primary)' : 'var(--color-text)',
                fontWeight: opt === value ? 600 : 400,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
