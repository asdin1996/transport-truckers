export default function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) pages.push(i)

  return (
    <div className="pagination">
      <button
        className="pagination__btn"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        ‹
      </button>

      {pages.map((p) => (
        <button
          key={p}
          className={`pagination__btn${p === page ? ' active' : ''}`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}

      <button
        className="pagination__btn"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        ›
      </button>
    </div>
  )
}
