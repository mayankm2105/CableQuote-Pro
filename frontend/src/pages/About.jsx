function About() {
  const features = [
    {
      title: 'Dynamic Quotation Generation',
      description: 'Generate professional PDFs instantly.',
    },
    {
      title: 'Auto Tag System',
      description: 'Unique quotation numbers (QTO/YY-YY/GMI/ID).',
    },
    {
      title: 'Editable Quotations',
      description: 'Modify saved quotations anytime.',
    },
    {
      title: 'Terms & Conditions Editor',
      description: 'Customize terms dynamically.',
    },
    {
      title: 'Company Management',
      description: 'Save and reuse company details.',
    },
    {
      title: 'PDF Preview',
      description: 'Open PDF in a new tab before downloading.',
    },
    {
      title: 'Clean Dashboard',
      description: 'View and manage all quotations easily.',
    },
  ]

  const repoUrl = 'https://github.com/your-username/your-repo'

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0.5rem 0',
      }}
    >
      {/* HERO */}
      <section
        style={{
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '2rem 1.75rem',
          boxShadow: 'var(--shadow)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--text-h)', fontWeight: 800 }}>
          Cable Quotation Management System
        </h1>
        <p style={{ marginTop: '0.75rem', marginBottom: 0, color: 'var(--text)', fontSize: '1.02rem', lineHeight: 1.6 }}>
          A fast, professional tool to create, manage, and generate industrial cable quotations.
        </p>
      </section>

      {/* FEATURES */}
      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-h)', fontSize: '1.2rem' }}>Key Features</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '0.9rem',
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1.1rem 1rem',
                boxShadow: 'var(--shadow)',
                minHeight: '120px',
              }}
            >
              <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1rem' }}>{f.title}</h3>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text)', lineHeight: 1.55, fontSize: '0.95rem' }}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-h)', fontSize: '1.2rem' }}>How it Works</h2>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '1.25rem 1.25rem',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.8rem',
            }}
          >
            {[
              'Add Company Details',
              'Enter Cable Items',
              'Customize Terms',
              'Generate PDF',
              'Save & Manage Quotations',
            ].map((step, idx) => (
              <div
                key={step}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '0.9rem 0.85rem',
                  background: 'var(--bg)',
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--accent)' }}>Step {idx + 1}</div>
                <div style={{ marginTop: '0.35rem', color: 'var(--text-h)', fontWeight: 700 }}>{step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPANY + DEVELOPER */}
      <section style={{ marginTop: '1.5rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '0.9rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '1.25rem 1.25rem',
              boxShadow: 'var(--shadow)',
            }}
          >
            <h2 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.1rem' }}>Company</h2>
            <h3 style={{ margin: '0.6rem 0 0 0', color: 'var(--accent)', fontSize: '1.2rem' }}>G.M. INDUSTRIES</h3>
            <p style={{ marginTop: '0.6rem', color: 'var(--text)', lineHeight: 1.6 }}>
              Manufacturer of Control &amp; Instrumentation Cables based in Panipat, Haryana.
            </p>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '1.25rem 1.25rem',
              boxShadow: 'var(--shadow)',
            }}
          >
            <h2 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.1rem' }}>Developer</h2>
            <h3 style={{ margin: '0.6rem 0 0 0', color: 'var(--accent)', fontSize: '1.2rem' }}>Mayank Maheshwari</h3>
            <p style={{ marginTop: '0.6rem', color: 'var(--text)', lineHeight: 1.6 }}>
              Developed as a full-stack solution for efficient quotation management.
            </p>
          </div>
        </div>
      </section>

      {/* GITHUB LINK */}
      <section style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <a
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block',
            textDecoration: 'none',
            background: 'var(--accent)',
            color: '#ffffff',
            padding: '0.75rem 1.1rem',
            borderRadius: '10px',
            fontWeight: 800,
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: 'var(--shadow)',
          }}
        >
          View Source Code
        </a>
      </section>

      {/* FOOTER NOTE */}
      <footer style={{ marginTop: '1.75rem', textAlign: 'center', color: 'var(--text)', padding: '0 0.5rem 1rem 0.5rem' }}>
        © 2026 G.M. INDUSTRIES | Built with React, Node.js, Prisma
      </footer>
    </div>
  )
}

export default About

