import useScrollLock from '../hooks/useScrollLock'

export default function Modal({ onClose, maxWidth = 520, children }) {
  useScrollLock()

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className="modal" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
