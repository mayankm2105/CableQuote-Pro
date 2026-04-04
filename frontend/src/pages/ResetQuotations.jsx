import { useState } from 'react'
import './ResetQuotations.css'
import { API_URL } from '../config/api'

function ResetQuotations() {
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  function handleOpenModal() {
    setMessage(null)
    setError(null)
    setShowModal(true)
  }

  function handleCloseModal() {
    setShowModal(false)
  }

  async function handleConfirmReset() {
    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch(`${API_URL}/quotations/reset`, {
        method: 'DELETE'
      })
      const json = await res.json().catch(() => ({}))
      
      if (!res.ok) {
        throw new Error(json.message || 'Failed to reset database')
      }

      setMessage('Database reset successfully. Quotation counter has been reset to 0.')
      setShowModal(false)
    } catch (err) {
      setError(err.message)
      setShowModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="reset-quotations">
      <div className="reset-card">
        <div className="reset-card__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        
        <h2 className="reset-card__title">Reset Database</h2>
        
        <p className="reset-card__desc">
          This will permanently delete all saved quotations and reset the quotation serial counter to 0. 
          Company and cable description records will NOT be deleted. This action cannot be undone.
        </p>

        {error && <div className="reset-card__msg reset-card__msg--error">{error}</div>}
        {message && <div className="reset-card__msg reset-card__msg--ok">{message}</div>}

        <div className="reset-card__actions">
          <button 
            type="button" 
            className="reset-btn-trigger" 
            onClick={handleOpenModal}
            disabled={submitting}
          >
            Reset All Quotations
          </button>
        </div>
      </div>

      {showModal && (
        <div className="reset-modal-overlay">
          <div className="reset-modal">
            <h3 className="reset-modal__title">Are you sure?</h3>
            <p className="reset-modal__text">This will delete all quotation records permanently.</p>
            <div className="reset-modal__actions">
              <button 
                type="button" 
                className="reset-modal-btn reset-modal-btn--cancel" 
                onClick={handleCloseModal}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="reset-modal-btn reset-modal-btn--confirm" 
                onClick={handleConfirmReset}
                disabled={submitting}
              >
                {submitting ? 'Resetting...' : 'Yes, Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResetQuotations
