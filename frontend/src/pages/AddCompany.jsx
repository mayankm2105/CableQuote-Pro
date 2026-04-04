import { useState, useEffect } from 'react'
import './AddCompany.css'
import { API_URL } from '../config/api'

function AddCompany() {
  const [unitId, setUnitId] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchCompanies()
  }, [])

  async function fetchCompanies() {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/companies`)
      if (!res.ok) throw new Error('Failed to fetch companies')
      const json = await res.json()
      setCompanies(Array.isArray(json) ? json : (json.data || []))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)

    try {
      const res = await fetch(`${API_URL}/api/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId.trim(),
          name: name.trim(),
          address: address.trim()
        })
      })
      
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.message || 'Failed to add company')
      }

      setMessage('Company added successfully.')
      setUnitId('')
      setName('')
      setAddress('')
      fetchCompanies()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this company?')) return

    try {
      const res = await fetch(`${API_URL}/api/companies/${id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) {
        throw new Error('Failed to delete company')
      }
      
      setMessage('Company deleted.')
      fetchCompanies()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="add-company">
      {/* SECTION 1: ADD COMPANY FORM */}
      <section className="company-card">
        <header className="company-card__header">
          <h2>Add New Company</h2>
        </header>
        <div className="company-card__body">
          <form className="company-form" onSubmit={handleSubmit}>
            <div className="company-form__row">
              <label className="company-form__field">
                <span>UNIT ID <span className="required-star">*</span></span>
                <input
                  type="text"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value.toUpperCase())}
                  required
                  placeholder="e.g. RAJSHREE"
                  style={{ textTransform: 'uppercase' }}
                />
              </label>
              <label className="company-form__field">
                <span>Company Name <span className="required-star">*</span></span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Rajshree Industries Ltd."
                />
              </label>
            </div>
            <label className="company-form__field">
              <span>Full Address</span>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="Enter complete address..."
              />
            </label>

            <div className="company-form__actions">
              <button type="submit" className="company-submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Company'}
              </button>
            </div>
          </form>

          {error && <div className="company-msg company-msg--error">{error}</div>}
          {message && <div className="company-msg company-msg--ok">{message}</div>}
        </div>
      </section>

      {/* SECTION 2: REGISTERED COMPANIES TABLE */}
      <section className="company-card mt-8">
        <header className="company-card__header">
          <h2>Registered Companies</h2>
        </header>
        <div className="company-card__body p-0">
          <div className="company-table-wrap">
            <table className="company-table">
              <thead>
                <tr>
                  <th>UNIT ID</th>
                  <th>Company Name</th>
                  <th>Address</th>
                  <th aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                {loading && companies.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">Loading companies...</td>
                  </tr>
                ) : companies.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">No companies registered yet.</td>
                  </tr>
                ) : (
                  companies.map((comp) => (
                    <tr key={comp.id}>
                      <td className="unit-id-cell">{comp.unit_id}</td>
                      <td>{comp.name}</td>
                      <td>{comp.address || '—'}</td>
                      <td className="text-center">
                        <button 
                          type="button" 
                          className="company-delete"
                          onClick={() => handleDelete(comp.id)}
                          aria-label={`Delete ${comp.name}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AddCompany
