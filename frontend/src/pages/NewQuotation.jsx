import { useMemo, useRef, useState, useEffect } from 'react'
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

function NewQuotation() {
  const [clientName, setClientName] = useState('')
  const [unitName, setUnitName] = useState('')
  const [address, setAddress] = useState('')

  const [companyId, setCompanyId] = useState('')
  const [loadedUnitId, setLoadedUnitId] = useState('')
  const [loadingCompany, setLoadingCompany] = useState(false)
  const [companyError, setCompanyError] = useState(null)
  const [isManualOverride, setIsManualOverride] = useState(true)

  const [enquiryNo, setEnquiryNo] = useState('')
  const [rows, setRows] = useState([createEmptyRow()])
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [availableCables, setAvailableCables] = useState([])
  const [companies, setCompanies] = useState([])
  const [unitSelect, setUnitSelect] = useState('__MANUAL__')

  // ─── Terms & Conditions (used for PDF rendering) ────────────────
  const [forMode, setForMode] = useState('FOR_ARC_TPT_GODOWN')
  const [forManualText, setForManualText] = useState('')

  const [freightMode, setFreightMode] = useState('EXTRA')
  const [freightManualText, setFreightManualText] = useState('')

  const [deliveryMode, setDeliveryMode] = useState('AUTO')
  const [deliveryManualText, setDeliveryManualText] = useState('')
  const [deliveryLowerWeeks, setDeliveryLowerWeeks] = useState(4)
  const [deliveryUpperWeeks, setDeliveryUpperWeeks] = useState(5)
  const [deliveryLowerDays, setDeliveryLowerDays] = useState(10)
  const [deliveryUpperDays, setDeliveryUpperDays] = useState(15)

  const [validityMode, setValidityMode] = useState('AUTO')
  const [validityDays, setValidityDays] = useState(5)
  const [validityManualText, setValidityManualText] = useState('')

  const [paymentMode, setPaymentMode] = useState('AUTO')
  const [paymentDays, setPaymentDays] = useState(45)
  const [paymentManualText, setPaymentManualText] = useState('')

  const [insuranceMode, setInsuranceMode] = useState('NIL')
  const [insuranceManualText, setInsuranceManualText] = useState('')

  const toolbarBtnStyle = {
    padding: '0.35rem 0.6rem',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    background: '#ffffff',
    color: 'var(--text-h)',
    cursor: 'pointer',
    font: 'inherit',
    lineHeight: 1,
  }

  const richTextBoxStyle = {
    width: '100%',
    minHeight: '40px',
    padding: '0.5rem 0.75rem',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    background: '#ffffff',
    color: 'var(--text-h)',
    font: 'inherit',
    outline: 'none',
    whiteSpace: 'pre-wrap',
  }

  function formatAmount(n) {
    if (!Number.isFinite(n)) return '—'
    return n.toFixed(2)
  }

  const { rowAmounts, totalAmount } = useMemo(() => {
    const amounts = rows.map((row) => {
      const qty = parseInt(String(row.quantity_meters).trim(), 10)
      const rate = parseFloat(String(row.rate_per_meter).trim())
      if (!Number.isFinite(qty) || !Number.isFinite(rate)) return NaN
      return qty * rate
    })
    const total = amounts.reduce((sum, a) => (Number.isFinite(a) ? sum + a : sum), 0)
    return { rowAmounts: amounts, totalAmount: total }
  }, [rows])

  function RichTextField({ valueHtml, onChangeHtml, placeholder, ariaLabel }) {
    const editorRef = useRef(null)
    const latestHtmlRef = useRef(valueHtml || '')
    const lastSelectionRef = useRef(null)
    const isFocusedRef = useRef(false)
    const didInitFormatRef = useRef(false)

    const [isBoldActive, setIsBoldActive] = useState(false)
    const [isItalicActive, setIsItalicActive] = useState(false)
    const [isUnderlineActive, setIsUnderlineActive] = useState(false)

    function isSelectionInsideEditor() {
      const el = editorRef.current
      const sel = document.getSelection?.()
      if (!el || !sel || sel.rangeCount === 0) return false
      const node = sel.anchorNode
      return node ? el.contains(node) : false
    }

    function saveSelection() {
      const sel = document.getSelection?.()
      if (!sel || sel.rangeCount === 0) return
      lastSelectionRef.current = sel.getRangeAt(0).cloneRange()
    }

    function restoreSelection() {
      const range = lastSelectionRef.current
      const sel = document.getSelection?.()
      if (!range || !sel) return
      sel.removeAllRanges()
      sel.addRange(range)
    }

    function updateToolbarState() {
      setIsBoldActive(Boolean(document.queryCommandState?.('bold')))
      setIsItalicActive(Boolean(document.queryCommandState?.('italic')))
      setIsUnderlineActive(Boolean(document.queryCommandState?.('underline')))
    }

    function commitToState() {
      const el = editorRef.current
      if (!el) return
      const html = el.innerHTML
      latestHtmlRef.current = html
      onChangeHtml(html)
    }

    useEffect(() => {
      const el = editorRef.current
      if (!el) return

      const next = valueHtml || ''
      latestHtmlRef.current = next
      if (!isFocusedRef.current && el.innerHTML !== next) {
        el.innerHTML = next
      }
    }, [valueHtml])

    useEffect(() => {
      function handleSelectionChange() {
        if (!isSelectionInsideEditor()) return
        saveSelection()
        updateToolbarState()
      }

      document.addEventListener('selectionchange', handleSelectionChange)
      return () => document.removeEventListener('selectionchange', handleSelectionChange)
    }, [])

    useEffect(() => {
      const el = editorRef.current
      if (!el) return

      function onFocus() {
        isFocusedRef.current = true
        if (!didInitFormatRef.current) {
          didInitFormatRef.current = true
          el.focus()
          restoreSelection()
          document.execCommand('removeFormat')
          el.focus()
          saveSelection()
        }
        updateToolbarState()
      }

      function onBlur() {
        isFocusedRef.current = false
        commitToState()
      }

      function onInput() {
        // Avoid React state updates on every keystroke (fix lag).
        latestHtmlRef.current = el.innerHTML
      }

      el.addEventListener('focus', onFocus)
      el.addEventListener('blur', onBlur)
      el.addEventListener('input', onInput)

      // Also commit on form submit (so blur isn't required).
      const form = el.closest('form')
      function onFormSubmit() {
        commitToState()
      }
      form?.addEventListener('submit', onFormSubmit)

      return () => {
        el.removeEventListener('focus', onFocus)
        el.removeEventListener('blur', onBlur)
        el.removeEventListener('input', onInput)
        form?.removeEventListener('submit', onFormSubmit)
      }
    }, [])

    function applyCommand(cmd) {
      const el = editorRef.current
      if (!el) return
      el.focus()
      restoreSelection()
      document.execCommand(cmd)
      el.focus()
      saveSelection()
      updateToolbarState()
    }

    const activeBtnStyle = {
      backgroundColor: '#007bff',
      color: 'white',
      borderColor: '#007bff',
    }

    return (
      <div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <button
            type="button"
            className={isBoldActive ? 'active' : ''}
            aria-pressed={isBoldActive}
            onMouseDown={(e) => {
              e.preventDefault()
              saveSelection()
            }}
            onClick={() => applyCommand('bold')}
            style={{ ...toolbarBtnStyle, ...(isBoldActive ? activeBtnStyle : null) }}
            aria-label="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={isItalicActive ? 'active' : ''}
            aria-pressed={isItalicActive}
            onMouseDown={(e) => {
              e.preventDefault()
              saveSelection()
            }}
            onClick={() => applyCommand('italic')}
            style={{ ...toolbarBtnStyle, ...(isItalicActive ? activeBtnStyle : null) }}
            aria-label="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className={isUnderlineActive ? 'active' : ''}
            aria-pressed={isUnderlineActive}
            onMouseDown={(e) => {
              e.preventDefault()
              saveSelection()
            }}
            onClick={() => applyCommand('underline')}
            style={{ ...toolbarBtnStyle, ...(isUnderlineActive ? activeBtnStyle : null) }}
            aria-label="Underline"
          >
            <span style={{ textDecoration: 'underline', fontWeight: 700 }}>U</span>
          </button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-label={ariaLabel}
          data-placeholder={placeholder}
          style={richTextBoxStyle}
        />
      </div>
    )
  }

  useEffect(() => {
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
    fetchCables()
  }, [])

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch(`${API_URL}/api/companies`)
        const json = await res.json()
        if (res.ok) {
          setCompanies(Array.isArray(json) ? json : (json.data || []))
        }
      } catch (err) {
        console.error('Failed to load companies', err)
      }
    }

    fetchCompanies()
  }, [])

  function handleUnitDropdownChange(nextUnitId) {
    setUnitSelect(nextUnitId)

    if (nextUnitId === '__MANUAL__') {
      setIsManualOverride(true)
      setLoadedUnitId('')
      return
    }

    const comp = companies.find((c) => c.unit_id === nextUnitId)
    if (!comp) return

    setClientName(comp.name || '')
    setUnitName(comp.unit_id || '')
    setAddress(comp.address || '')
    setLoadedUnitId(comp.unit_id || '')
    setIsManualOverride(false)
  }

  async function handleLoadCompany() {
    if (!companyId.trim()) return
    setLoadingCompany(true)
    setCompanyError(null)

    try {
      const res = await fetch(`${API_URL}/api/companies/${companyId.trim()}`)
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        setCompanyError('Company not found')
        return
      }

      const comp = json.data
      setClientName(comp.name || '')
      setUnitName(comp.unit_id || '')
      setAddress(comp.address || '')
      setLoadedUnitId(comp.unit_id || '')
      setIsManualOverride(false)
    } catch (err) {
      setCompanyError('Network error')
    } finally {
      setLoadingCompany(false)
    }
  }

  function updateRow(index, field, value) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    )
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
    setMessage(null)
    setError(null)
    setSubmitting(true)

    const selectInlineStyle = {
      width: '100%',
      padding: '0.5rem 0.75rem',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      background: '#ffffff',
      color: 'var(--text-h)',
      font: 'inherit',
    }

    function buildTermsPayload() {
      const forValue =
        forMode === 'MANUAL'
          ? (forManualText || '').trim()
          : forMode === 'FOR_ARC_TPT_GODOWN'
            ? 'FOR ARC TPT Godown Delivery'
            : forMode === 'FOR_SITE_DELIVERY'
              ? 'FOR SITE Delivery'
              : 'FOR ARC Transit Panipat'

      const freightValue =
        freightMode === 'MANUAL' ? (freightManualText || '').trim() : freightMode

      const deliveryValue =
        deliveryMode === 'MANUAL'
          ? (deliveryManualText || '').trim()
          : `${deliveryLowerWeeks}-${deliveryUpperWeeks} weeks from our plant, Transit time extra ${deliveryLowerDays}-${deliveryUpperDays} days`

      const validityValue =
        validityMode === 'MANUAL'
          ? (validityManualText || '').trim()
          : `The quoted rates are valid for ${validityDays} Days from the date of offer subject to prior confirmation thereafter.`

      const paymentValue =
        paymentMode === 'MANUAL'
          ? (paymentManualText || '').trim()
          : `${paymentDays} days after receipt & approval of material`

      const insuranceValue =
        insuranceMode === 'MANUAL'
          ? (insuranceManualText || '').trim()
          : insuranceMode

      return {
        forValue: forValue || undefined,
        freightValue: freightValue || undefined,
        deliveryValue: deliveryValue || undefined,
        validityValue: validityValue || undefined,
        paymentValue: paymentValue || undefined,
        insuranceValue: insuranceValue || undefined,
      }
    }

    const termsPayload = buildTermsPayload()

    const cable_items = rows.map((row) => {
      const qty = parseInt(String(row.quantity_meters).trim(), 10)
      const rate = parseFloat(String(row.rate_per_meter).trim())
      return {
        description: row.description.trim(),
        quantity_meters: Number.isFinite(qty) ? qty : NaN,
        rate_per_meter: Number.isFinite(rate) ? rate : NaN,
      }
    })

    const body = {
      client_name: clientName.trim(),
      client_unit: isManualOverride ? unitName.trim() : loadedUnitId,
      client_address: address.trim(),
      enquiry_no: enquiryNo.trim(),
      cable_items,
      terms: termsPayload,
    }

    try {
      const res = await fetch(`${API_URL}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        const errText =
          Array.isArray(json.errors) && json.errors.length
            ? json.errors.join('; ')
            : json.message || `Request failed (${res.status})`
        setError(errText)
        return
      }

      const id = json.data?.id
      if (id != null) {
        setMessage('Quotation created. Opening PDF…')
        const termsJson = JSON.stringify(termsPayload || {})
        const termsB64 = btoa(unescape(encodeURIComponent(termsJson)))
        const url = `${API_URL}/quotations/${id}/pdf?terms=${encodeURIComponent(termsB64)}`
        window.open(url, '_blank')
      } else {
        setMessage('Quotation created, but could not open PDF (missing id).')
      }
    } catch (err) {
      setError(err.message || 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="new-quotation">
      <h1 className="new-quotation__title">New Quotation</h1>

      <form className="new-quotation__form" onSubmit={handleSubmit}>
        <fieldset className="new-quotation__fieldset">
          <legend>Client</legend>

          <div className="company-search-row">
            <label className="new-quotation__field company-search-field">
              <span>Unit</span>
              <select
                className="company-unit-select"
                value={unitSelect}
                onChange={(e) => handleUnitDropdownChange(e.target.value)}
              >
                <option value="__MANUAL__">Manual Entry</option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.unit_id}>
                    {comp.unit_id} - {comp.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="company-info-block">
            {isManualOverride ? (
              <div className="company-manual-inputs">
                <div className="company-manual-header">
                  <span className="info-badge">Manual Entry Mode</span>
                </div>
                <label className="new-quotation__field">
                  <span>Company Name</span>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                  />
                </label>
                <label className="new-quotation__field">
                  <span>Unit Name</span>
                  <input
                    type="text"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                  />
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
              </div>
            ) : (
              <div className="company-info-card">
                <div className="company-info-header">
                  <span className="info-title">Loaded Company Details</span>
                  <button
                    type="button"
                    className="company-edit-btn"
                    onClick={() => handleUnitDropdownChange('__MANUAL__')}
                    title="Override manually"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    Edit manually
                  </button>
                </div>
                <div className="company-info-content">
                  <div className="company-info-item">
                    <strong>Name:</strong> {clientName || '—'}
                  </div>
                  <div className="company-info-item">
                    <strong>Unit:</strong> {unitName || '—'}
                  </div>
                  <div className="company-info-item">
                    <strong>Address:</strong> {address || '—'}
                  </div>
                </div>
              </div>
            )}
          </div>

          <hr className="divider" />

          <label className="new-quotation__field mt-3">
            <span>Enquiry number</span>
            <input
              type="text"
              value={enquiryNo}
              onChange={(e) => setEnquiryNo(e.target.value)}
              required
            />
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
                <th>Amount</th>
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
                  amount={rowAmounts[index]}
                  onChange={(field, value) => updateRow(index, field, value)}
                  onRemove={() => removeRow(index)}
                  canRemove={rows.length > 1}
                  availableCables={availableCables}
                />
              ))}
              <tr>
                <td />
                <td />
                <td />
                <td style={{ textAlign: 'right', fontWeight: 700 }}>TOTAL</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>₹ {formatAmount(totalAmount)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>

        {error && <p className="new-quotation__msg new-quotation__msg--error" role="alert">{error}</p>}
        {message && <p className="new-quotation__msg new-quotation__msg--ok">{message}</p>}

      {/* Terms & Conditions (only affects PDF generation) */}
      <fieldset className="new-quotation__fieldset">
        <legend>Terms &amp; Conditions</legend>

        <label className="new-quotation__field">
          <span>F.O.R</span>
          <select
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: '#ffffff',
              color: 'var(--text-h)',
              font: 'inherit',
            }}
            value={forMode}
            onChange={(e) => setForMode(e.target.value)}
          >
            <option value="FOR_ARC_TPT_GODOWN">FOR ARC TPT Godown Delivery</option>
            <option value="FOR_SITE_DELIVERY">FOR SITE Delivery</option>
            <option value="FOR_ARC_TRANSIT_PANIPAT">FOR ARC Transit Panipat</option>
            <option value="MANUAL">Manual Entry</option>
          </select>
        </label>

        {forMode === 'MANUAL' ? (
          <label className="new-quotation__field">
            <span>Manual F.O.R text</span>
            <RichTextField
              valueHtml={forManualText}
              onChangeHtml={setForManualText}
              placeholder="e.g. FOR ARC TPT Godown Delivery"
              ariaLabel="Manual F.O.R text"
            />
          </label>
        ) : null}

        <label className="new-quotation__field">
          <span>FREIGHT</span>
          <select
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: '#ffffff',
              color: 'var(--text-h)',
              font: 'inherit',
            }}
            value={freightMode}
            onChange={(e) => setFreightMode(e.target.value)}
          >
            <option value="EXTRA">EXTRA</option>
            <option value="NIL">NIL</option>
            <option value="MANUAL">Manual Entry</option>
          </select>
        </label>

        {freightMode === 'MANUAL' ? (
          <label className="new-quotation__field">
            <span>Manual Freight text</span>
            <RichTextField
              valueHtml={freightManualText}
              onChangeHtml={setFreightManualText}
              placeholder="e.g. EXTRA"
              ariaLabel="Manual Freight text"
            />
          </label>
        ) : null}

        <label className="new-quotation__field">
          <span>DELIVERY</span>
          <select
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: '#ffffff',
              color: 'var(--text-h)',
              font: 'inherit',
            }}
            value={deliveryMode}
            onChange={(e) => setDeliveryMode(e.target.value)}
          >
            <option value="AUTO">Auto (weeks/days)</option>
            <option value="MANUAL">Manual Entry</option>
          </select>
        </label>

        {deliveryMode === 'AUTO' ? (
          <>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <label className="new-quotation__field" style={{ flex: '1 1 12rem' }}>
                <span>Lower weeks</span>
                <input
                  type="number"
                  value={deliveryLowerWeeks}
                  onChange={(e) => setDeliveryLowerWeeks(Number(e.target.value))}
                  min="0"
                />
              </label>
              <label className="new-quotation__field" style={{ flex: '1 1 12rem' }}>
                <span>Upper weeks</span>
                <input
                  type="number"
                  value={deliveryUpperWeeks}
                  onChange={(e) => setDeliveryUpperWeeks(Number(e.target.value))}
                  min="0"
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <label className="new-quotation__field" style={{ flex: '1 1 12rem' }}>
                <span>Lower days</span>
                <input
                  type="number"
                  value={deliveryLowerDays}
                  onChange={(e) => setDeliveryLowerDays(Number(e.target.value))}
                  min="0"
                />
              </label>
              <label className="new-quotation__field" style={{ flex: '1 1 12rem' }}>
                <span>Upper days</span>
                <input
                  type="number"
                  value={deliveryUpperDays}
                  onChange={(e) => setDeliveryUpperDays(Number(e.target.value))}
                  min="0"
                />
              </label>
            </div>
          </>
        ) : (
          <label className="new-quotation__field">
            <span>Manual Delivery text</span>
            <RichTextField
              valueHtml={deliveryManualText}
              onChangeHtml={setDeliveryManualText}
              placeholder="e.g. 4-5 weeks from our plant, Transit time extra 10-15 days"
              ariaLabel="Manual Delivery text"
            />
          </label>
        )}

        <label className="new-quotation__field">
          <span>VALIDITY</span>
          <select
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: '#ffffff',
              color: 'var(--text-h)',
              font: 'inherit',
            }}
            value={validityMode}
            onChange={(e) => setValidityMode(e.target.value)}
          >
            <option value="AUTO">Auto (days)</option>
            <option value="MANUAL">Manual Entry</option>
          </select>
        </label>

        {validityMode === 'AUTO' ? (
          <label className="new-quotation__field">
            <span>Number of days</span>
            <input
              type="number"
              value={validityDays}
              onChange={(e) => setValidityDays(Number(e.target.value))}
              min="0"
            />
          </label>
        ) : (
          <label className="new-quotation__field">
            <span>Manual Validity text</span>
            <RichTextField
              valueHtml={validityManualText}
              onChangeHtml={setValidityManualText}
              placeholder="e.g. The quoted rates are valid for 7 Days from..."
              ariaLabel="Manual Validity text"
            />
          </label>
        )}

        <label className="new-quotation__field">
          <span>PAYMENT</span>
          <select
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: '#ffffff',
              color: 'var(--text-h)',
              font: 'inherit',
            }}
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
          >
            <option value="AUTO">Auto (days)</option>
            <option value="MANUAL">Manual Entry</option>
          </select>
        </label>

        {paymentMode === 'AUTO' ? (
          <label className="new-quotation__field">
            <span>Number of days</span>
            <input
              type="number"
              value={paymentDays}
              onChange={(e) => setPaymentDays(Number(e.target.value))}
              min="0"
            />
          </label>
        ) : (
          <label className="new-quotation__field">
            <span>Manual Payment text</span>
            <RichTextField
              valueHtml={paymentManualText}
              onChangeHtml={setPaymentManualText}
              placeholder="e.g. 60 days after receipt & approval of material"
              ariaLabel="Manual Payment text"
            />
          </label>
        )}

        <label className="new-quotation__field">
          <span>INSURANCE</span>
          <select
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: '#ffffff',
              color: 'var(--text-h)',
              font: 'inherit',
            }}
            value={insuranceMode}
            onChange={(e) => setInsuranceMode(e.target.value)}
          >
            <option value="NIL">NIL</option>
            <option value="EXTRA">EXTRA</option>
            <option value="MANUAL">Manual Entry</option>
          </select>
        </label>

        {insuranceMode === 'MANUAL' ? (
          <label className="new-quotation__field">
            <span>Manual Insurance text</span>
            <RichTextField
              valueHtml={insuranceManualText}
              onChangeHtml={setInsuranceManualText}
              placeholder="e.g. EXTRA"
              ariaLabel="Manual Insurance text"
            />
          </label>
        ) : null}
      </fieldset>

      <div className="new-quotation__actions">
        <button type="submit" className="new-quotation__submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit quotation'}
        </button>
      </div>
      </form>
    </div>
  )
}

export default NewQuotation
