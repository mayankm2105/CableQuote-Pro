import { useState, useEffect } from 'react'
import './ViewQuotations.css'
import EditQuotation from './EditQuotation'
import { API_URL } from '../config/api'

function ViewQuotations() {
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [routePath, setRoutePath] = useState(() => window.location.pathname || '/')

  useEffect(() => {
    fetchQuotations()
  }, [])

  useEffect(() => {
    function handlePopState() {
      setRoutePath(window.location.pathname || '/')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  async function fetchQuotations() {
    try {
      const res = await fetch(`${API_URL}/quotations`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to fetch quotations')
      setQuotations(Array.isArray(json) ? json : (json.data || []))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const editMatch = routePath.match(/^\/edit\/(\d+)(?:\/)?$/)
  const editId = editMatch ? parseInt(editMatch[1], 10) : null

  function navigateToEdit(nextId) {
    const nextPath = `/edit/${nextId}`
    window.history.pushState({}, '', nextPath)
    setRoutePath(nextPath)
  }

  function navigateToHistory() {
    const nextPath = '/history'
    window.history.pushState({}, '', nextPath)
    setRoutePath(nextPath)
  }

  function handleDownloadClick(id, e) {
    if (!id) {
      e.preventDefault()
      return
    }

    e.preventDefault()
    const url = `${API_URL}/quotations/${id}/pdf`
    window.open(url, '_blank')
  }

  if (editId != null && Number.isFinite(editId)) {
    return (
      <EditQuotation
        quotationId={editId}
        onDone={() => {
          navigateToHistory()
        }}
      />
    )
  }

  return (
    <div className="view-quotations">
      <section className="quote-card">
        <header className="quote-card__header">
          <h2>Past Quotations</h2>
        </header>
        <div className="quote-card__body p-0">
          {error && <div className="quote-msg quote-msg--error">{error}</div>}
          
          <div className="quote-table-wrap">
            <table className="quote-table">
              <thead>
                <tr>
                  <th>Quotation Tag</th>
                  <th>Client Name</th>
                  <th>Date</th>
                  <th className="text-center">No. of Items</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center">Loading quotations...</td>
                  </tr>
                ) : quotations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">No quotations found.</td>
                  </tr>
                ) : (
                  quotations.map((q) => {
                    const itemCount = q.cable_items ? q.cable_items.length : 0
                    const formattedDate = new Date(q.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })

                    return (
                      <tr key={q.id}>
                        <td className="font-medium text-blue">{q.tag || `QTN-${q.id}`}</td>
                        <td>{q.client_name || '—'}</td>
                        <td>{formattedDate}</td>
                        <td className="text-center">{itemCount}</td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => navigateToEdit(q.id)}
                            title="Edit quotation"
                            aria-label={`Edit quotation ${q.id}`}
                            style={{
                              marginRight: '0.75rem',
                              background: '#ffffff',
                              color: '#111827',
                              border: '1px solid var(--border)',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            ✏️
                          </button>

                          <a
                            href={`${API_URL}/quotations/${q.id}/pdf`}
                            className="quote-download-btn"
                            onClick={(e) => handleDownloadClick(q.id, e)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Download PDF
                          </a>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ViewQuotations
