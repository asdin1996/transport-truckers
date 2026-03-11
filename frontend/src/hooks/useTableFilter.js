import { useState, useMemo } from 'react'

/**
 * Filtrado y ordenación client-side para listados.
 *
 * @param {Array}  data         - Array completo de datos (ya cargados)
 * @param {Array}  searchFields - Strings (campo directo) o funciones (item) => valor
 * @param {Object} sortGetters  - { colKey: (item) => valor } para columnas con valor calculado
 */
export default function useTableFilter(data, searchFields, sortGetters = {}) {
  const [query, setQuery] = useState('')
  const [sort, setSort]   = useState({ col: null, dir: 'asc' })

  const toggleSort = (col) => {
    setSort((prev) =>
      prev.col === col
        ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { col, dir: 'asc' }
    )
  }

  const processed = useMemo(() => {
    let result = data

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter((item) =>
        searchFields.some((f) => {
          const val = typeof f === 'function' ? f(item) : item[f]
          return String(val ?? '').toLowerCase().includes(q)
        })
      )
    }

    if (sort.col) {
      const getter = sortGetters[sort.col] ?? ((item) => item[sort.col])
      result = [...result].sort((a, b) => {
        const av = getter(a)
        const bv = getter(b)
        const cmp = String(av ?? '').localeCompare(String(bv ?? ''), 'es', { numeric: true })
        return sort.dir === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [data, query, sort])

  return { query, setQuery, sort, toggleSort, processed }
}
