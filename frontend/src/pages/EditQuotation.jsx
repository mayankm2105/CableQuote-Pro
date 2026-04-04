import { useEffect, useState } from 'react'
import CableItemRow from '../components/CableItemRow'
import './NewQuotation.css'
import { API_URL } from '../config/api'

function createEmptyRow() {
  return {
    id: crypto.randomUUID(),
    description: '',
    quantity_meters: '',
    rate_per_meter: '',
  }
}

function EditQuotation({ quotationId, onDone }) {
  const [clientName, setClientName] = useState('')
  const [unitName, setUnitName] = useState('')
  const [address, setAddress] = useState('')
  const [enquiryNo, setEnquiryNo] = useState('')

  const [rows, setRows] = useState([createEmptyRow()])
  const [availableCables, setAvailableCables] = useState([])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (!quotationId) return

    async function fetchCables() {
      try {
        const res = await fetch(`${API_URL}/api/cables`)
        const json = await res.json()
        if (res.ok) {
          setAvailableCables(Array.isArray(json) ? json : (json.data || []))
        }
      } catch (err) {
        console.error('Failed to load cables', err)
      }
    }

    async function fetchQuotation() {
      try {
        setError(null)
        const res = await fetch(`${API_URL}/quotations/${quotationId}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.message || 'Failed to fetch quotation')

        const q = json.data
        setClientName(q.client_name || '')
        setUnitName(q.client_unit || '')
        setAddress(q.client_address || '')
        setEnquiryNo(q.enquiry_no || '')

        const items = Array.isArray(q.cable_items) ? q.cable_items : []
        const mapped = items.length
          ? items.map((item, i) => ({
              id: crypto.randomUUID(),
              description: item.description || '',
              quantity_meters: item.quantity_meters != null ? String(item.quantity_meters) : '',
              rate_per_meter: item.rate_per_meter != null ? String(item.rate_per_meter) : '',
            }))
          : [createEmptyRow()]

        setRows(mapped)
      } catch (err) {
        setError(err.message || 'Network error')
      } finally {
        setLoading(false)
      }
    }

    fetchCables()
    fetchQuotation()
  }, [quotationId])

  function updateRow(index, field, value) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  function addRow() {
    setRows((prev) => [...prev, createEmptyRow()])
  }

  function removeRow(index) {
    setRows((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)

    try {
      const cable_items = rows.map((row) => {
        const description = row.description.trim()
        const quantity_meters = parseInt(String(row.quantity_meters).trim(), 10)
        const rate_per_meter = parseFloat(String(row.rate_per_meter).trim())

        return { description, quantity_meters, rate_per_meter }
      })

      const res = await fetch(`${API_URL}/quotations/${quotationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName.trim(),
          client_unit: unitName.trim(),
          client_address: address.trim(),
          enquiry_no: enquiryNo.trim(),
          cable_items,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`)

      setMessage('Quotation updated.')
      if (typeof onDone === 'function') onDone()
    } catch (err) {
      setError(err.message || 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="new-quotation">
        <h1 className="new-quotation__title">Edit Quotation</h1>
        <p className="new-quotation__msg">Loading…</p>
      </div>
    )
  }

  return (
    <div className="new-quotation">
      <h1 className="new-quotation__title">Edit Quotation</h1>

      <form className="new-quotation__form" onSubmit={handleSubmit}>
        <fieldset className="new-quotation__fieldset">
          <legend>Client</legend>

          <label className="new-quotation__field">
            <span>Client Name</span>
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
          </label>

          <label className="new-quotation__field">
            <span>Unit Name</span>
            <input type="text" value={unitName} onChange={(e) => setUnitName(e.target.value)} required />
          </label>

          <label className="new-quotation__field">
            <span>Address</span>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              rows={3}
            />
          </label>

          <label className="new-quotation__field">
            <span>Enquiry Number</span>
            <input type="text" value={enquiryNo} onChange={(e) => setEnquiryNo(e.target.value)} required />
          </label>
        </fieldset>

        <div className="new-quotation__table-wrap">
          <div className="new-quotation__table-head">
            <h2 className="new-quotation__section-title">Cable items</h2>
            <button type="button" className="new-quotation__add-row" onClick={addRow}>
              Add row
            </button>
          </div>

          <table className="new-quotation__table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>Description</th>
                <th>Quantity (meters)</th>
                <th>Rate per meter</th>
                <th aria-hidden="true" />
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <CableItemRow
                  key={row.id}
                  rowNumber={index + 1}
                  description={row.description}
                  quantityMeters={row.quantity_meters}
                  ratePerMeter={row.rate_per_meter}
                  onChange={(field, value) => updateRow(index, field, value)}
                  onRemove={() => removeRow(index)}
                  canRemove={rows.length > 1}
                  availableCables={availableCables}
                />
              ))}
            </tbody>
          </table>
        </div>

        {error && <p className="new-quotation__msg new-quotation__msg--error" role="alert">{error}</p>}
        {message && <p className="new-quotation__msg new-quotation__msg--ok">{message}</p>}

        <div className="new-quotation__actions">
          <button type="submit" className="new-quotation__submit" disabled={submitting}>
            {submitting ? 'Updating…' : 'Update quotation'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditQuotation

