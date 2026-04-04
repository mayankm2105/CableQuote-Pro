import { useState, useEffect } from 'react'
import './AddCable.css'
import { API_URL } from '../config/api'

function AddCable() {
  const [description, setDescription] = useState('')
  
  const [cables, setCables] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchCables()
  }, [])

  async function fetchCables() {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/cables`)
      if (!res.ok) throw new Error('Failed to fetch cables')
      const json = await res.json()
      setCables(Array.isArray(json) ? json : (json.data || []))
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
      const res = await fetch(`${API_URL}/api/cables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim()
        })
      })
      
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.message || 'Failed to add cable')
      }

      setMessage('Cable added successfully.')
      setDescription('')
      fetchCables()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this cable description?')) return

    try {
      const res = await fetch(`${API_URL}/api/cables/${id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) {
        throw new Error('Failed to delete cable')
      }
      
      setMessage('Cable deleted.')
      fetchCables()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="add-cable">
      {/* SECTION 1: ADD CABLE FORM */}
      <section className="cable-card">
        <header className="cable-card__header">
          <h2>Add New Cable Description</h2>
        </header>
        <div className="cable-card__body">
          <form className="cable-form" onSubmit={handleSubmit}>
            <label className="cable-form__field">
              <span>Cable Description</span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="e.g. 4 Core 16 sq.mm Copper Armoured"
              />
            </label>

            <div className="cable-form__actions">
              <button type="submit" className="cable-submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Cable'}
              </button>
            </div>
          </form>

          {error && <div className="cable-msg cable-msg--error">{error}</div>}
          {message && <div className="cable-msg cable-msg--ok">{message}</div>}
        </div>
      </section>

      {/* SECTION 2: SAVED CABLES TABLE */}
      <section className="cable-card mt-8">
        <header className="cable-card__header">
          <h2>Saved Cable Descriptions</h2>
        </header>
        <div className="cable-card__body p-0">
          <div className="cable-table-wrap">
            <table className="cable-table">
              <thead>
                <tr>
                  <th>S.NO</th>
                  <th>Description</th>
                  <th aria-label="Actions" style={{ width: '6rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {loading && cables.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center">Loading cables...</td>
                  </tr>
                ) : cables.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center">No cables saved yet.</td>
                  </tr>
                ) : (
                  cables.map((cable, index) => (
                    <tr key={cable.id || index}>
                      <td className="text-center">{cable.id || index + 1}</td>
                      <td>{cable.description}</td>
                      <td className="text-center">
                        <button 
                          type="button" 
                          className="cable-delete"
                          onClick={() => handleDelete(cable.id)}
                          aria-label={`Delete cable ${cable.id}`}
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

export default AddCable
