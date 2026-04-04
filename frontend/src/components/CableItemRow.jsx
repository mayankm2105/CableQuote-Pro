import { useState, useRef, useEffect } from 'react'
import './CableItemRow.css'

function CableItemRow({
  rowNumber,
  description,
  quantityMeters,
  ratePerMeter,
  onChange,
  onRemove,
  canRemove,
  availableCables = [],
}) {
  const [isManual, setIsManual] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!isManual && description) {
      setSearch(description)
    }
  }, [description, isManual])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredCables = availableCables.filter(c => 
    c.description.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(cableDesc) {
    if (cableDesc === '__MANUAL__') {
      setIsManual(true)
      setIsOpen(false)
    } else {
      onChange('description', cableDesc)
      setSearch(cableDesc)
      setIsOpen(false)
    }
  }

  return (
    <tr>
      <td className="cable-row__sno">{rowNumber}</td>
      <td style={{ position: 'relative' }}>
        {isManual ? (
          <div className="cable-hybrid-wrapper">
            <input
              type="text"
              className="cable-row__input"
              value={description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Type description manually..."
              aria-label={`Row ${rowNumber} description`}
              autoFocus
            />
            <button
              type="button"
              className="cable-list-btn"
              onClick={() => setIsManual(false)}
              title="Select from list"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>
          </div>
        ) : (
          <div className="cable-dropdown" ref={dropdownRef}>
            <input
              type="text"
              className="cable-row__input"
              value={search}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setSearch(e.target.value)
                setIsOpen(true)
                onChange('description', e.target.value)
              }}
              placeholder="Search or select description..."
              aria-label={`Row ${rowNumber} description`}
            />
            {isOpen && (
              <ul className="cable-dropdown__menu">
                {filteredCables.map(c => (
                  <li key={c.id} onClick={() => handleSelect(c.description)}>
                    {c.description}
                  </li>
                ))}
                {filteredCables.length === 0 && (
                  <li className="cable-dropdown__empty">No matches found</li>
                )}
                <li className="cable-dropdown__manual" onClick={() => handleSelect('__MANUAL__')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  Enter manually...
                </li>
              </ul>
            )}
          </div>
        )}
      </td>
      <td>
        <input
          type="number"
          className="cable-row__input cable-row__input--num"
          min="1"
          step="1"
          value={quantityMeters}
          onChange={(e) => onChange('quantity_meters', e.target.value)}
          placeholder="0"
          aria-label={`Row ${rowNumber} quantity (meters)`}
        />
      </td>
      <td>
        <input
          type="number"
          className="cable-row__input cable-row__input--num"
          min="0"
          step="0.01"
          value={ratePerMeter}
          onChange={(e) => onChange('rate_per_meter', e.target.value)}
          placeholder="0.00"
          aria-label={`Row ${rowNumber} rate per meter`}
        />
      </td>
      <td className="cable-row__actions">
        <button
          type="button"
          className="cable-row__remove"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Remove row ${rowNumber}`}
        >
          Remove
        </button>
      </td>
    </tr>
  )
}

export default CableItemRow
