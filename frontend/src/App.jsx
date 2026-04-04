import { useEffect, useState } from 'react'
import NewQuotation from './pages/NewQuotation'
import AddCompany from './pages/AddCompany'
import AddCable from './pages/AddCable'
import ViewQuotations from './pages/ViewQuotations'
import ResetQuotations from './pages/ResetQuotations'
import About from './pages/About'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname || '/'
    if (path === '/about' || path === '/about/') return 'About'
    return 'Add Cable'
  })

  useEffect(() => {
    function handlePopState() {
      const path = window.location.pathname || '/'
      if (path === '/about' || path === '/about/') {
        setActiveTab('About')
        return
      }

      // Only auto-switch away from About; keep other tabs (and their internal routing)
      // untouched to avoid breaking existing flows like /edit/:id inside View Quotations.
      if (activeTab === 'About') setActiveTab('Add Cable')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [activeTab])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__logo">CableQuote Pro</div>
        <nav className="app-header__nav">
          <button 
            className={`nav-tab ${activeTab === 'Add Cable' ? 'nav-tab--active' : ''}`}
            onClick={() => setActiveTab('Add Cable')}
          >
            Add Cable
          </button>
          <button 
            className={`nav-tab ${activeTab === 'Add Company' ? 'nav-tab--active' : ''}`}
            onClick={() => setActiveTab('Add Company')}
          >
            Add Company
          </button>
          <button 
            className={`nav-tab ${activeTab === 'Generate PDF' ? 'nav-tab--active' : ''}`}
            onClick={() => setActiveTab('Generate PDF')}
          >
            Generate PDF
          </button>
          <button 
            className={`nav-tab ${activeTab === 'View Quotations' ? 'nav-tab--active' : ''}`}
            onClick={() => setActiveTab('View Quotations')}
          >
            View Quotations
          </button>
          <button
            className={`nav-tab ${activeTab === 'About' ? 'nav-tab--active' : ''}`}
            onClick={() => {
              window.history.pushState({}, '', '/about')
              setActiveTab('About')
            }}
          >
            About
          </button>
          <button 
            className={`nav-tab nav-tab--danger ${activeTab === 'Reset Quotations' ? 'nav-tab--active-danger' : ''}`}
            onClick={() => setActiveTab('Reset Quotations')}
          >
            Reset Quotations
          </button>
        </nav>
      </header>
      <main className="app-main">
        {activeTab === 'Add Cable' ? <AddCable /> : null}
        {activeTab === 'Generate PDF' ? <NewQuotation /> : null}
        {activeTab === 'Add Company' ? <AddCompany /> : null}
        {activeTab === 'View Quotations' ? <ViewQuotations /> : null}
        {activeTab === 'About' ? <About /> : null}
        {activeTab === 'Reset Quotations' ? <ResetQuotations /> : null}
        {/* Placeholder for other tabs if they don't render anything yet */}
        {activeTab !== 'Add Cable' &&
        activeTab !== 'Generate PDF' &&
        activeTab !== 'Add Company' &&
        activeTab !== 'View Quotations' &&
        activeTab !== 'About' &&
        activeTab !== 'Reset Quotations' ? (
          <div style={{ textAlign: 'center', color: 'var(--text)', padding: '4rem' }}>
            <p>This tab is currently under construction.</p>
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default App
