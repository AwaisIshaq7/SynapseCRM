import { Link } from 'react-router-dom'

const screens = [
  {
    id: 'login',
    title: 'Login Screen',
    description: 'Simple sign-in layout with account entry, error area, and alternate access button.',
    blocks: [
      'Logo / product name',
      'Email field',
      'Password field',
      'Primary sign-in button',
      'Secondary demo access',
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard Screen',
    description: 'Top level overview with navigation, key metrics, alerts, and charts.',
    blocks: [
      'Top bar with profile',
      'Sidebar navigation',
      'KPI summary cards',
      'Trend chart area',
      'Churn alert list',
    ],
  },
  {
    id: 'customers',
    title: 'Customer List Screen',
    description: 'Search, filters, table rows, and quick actions for customer management.',
    blocks: [
      'Search and filters',
      'Customer table',
      'Status tags',
      'Action buttons',
      'Pagination controls',
    ],
  },
  {
    id: 'detail',
    title: 'Customer Detail Screen',
    description: 'Profile header, interaction history, sentiment notes, and action panel.',
    blocks: [
      'Customer header',
      'Relationship summary',
      'Interaction timeline',
      'Sentiment badges',
      'Follow-up actions',
    ],
  },
]

function WireBlock({ label, className = '' }) {
  return (
    <div className={`rounded-lg border border-dashed border-gray-400 bg-white/70 px-3 py-2 text-sm text-gray-700 ${className}`}>
      {label}
    </div>
  )
}

function WireFrame({ title, description, blocks, accent = 'bg-gray-100' }) {
  return (
    <section className="rounded-3xl border border-gray-300 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-300 px-5 py-4 bg-gray-50">
        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Wireframe</p>
        <h2 className="text-lg font-semibold text-gray-900 mt-1">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>

      <div className="p-5 space-y-4">
        <div className={`rounded-2xl border-2 border-dashed border-gray-400 ${accent} p-4`}>
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-3 space-y-3">
              <WireBlock label={blocks[0]} className="h-10 flex items-center" />
              <WireBlock label={blocks[1]} className="h-24 flex items-center justify-center text-center" />
            </div>

            <div className="md:col-span-6 space-y-3">
              <WireBlock label={blocks[2]} className="h-32 flex items-center justify-center text-center" />
              <div className="grid grid-cols-2 gap-3">
                <WireBlock label={`${blocks[3]} A`} className="h-16 flex items-center justify-center text-center" />
                <WireBlock label={`${blocks[3]} B`} className="h-16 flex items-center justify-center text-center" />
              </div>
            </div>

            <div className="md:col-span-3 space-y-3">
              <WireBlock label={blocks[4]} className="h-10 flex items-center" />
              <WireBlock label="Notes / info panel" className="h-40 flex items-center justify-center text-center" />
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <WireBlock label="Key area 1" className="h-16 flex items-center justify-center" />
          <WireBlock label="Key area 2" className="h-16 flex items-center justify-center" />
          <WireBlock label="Key area 3" className="h-16 flex items-center justify-center" />
          <WireBlock label="Key area 4" className="h-16 flex items-center justify-center" />
        </div>
      </div>
    </section>
  )
}

export default function PrototypePage() {
  return (
    <div className="min-h-screen bg-[#f6f6f4] text-gray-900">
      <header className="border-b border-gray-300 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">SynapseCRM</p>
            <h1 className="text-2xl font-bold">Low-Fidelity UI Prototype</h1>
            <p className="text-sm text-gray-600 mt-1">Temporary wireframe set for survey, presentation, and report screenshots.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="rounded-lg border border-gray-400 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Back to app
            </Link>
            <a href="#screens" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">
              View screens
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl border border-gray-300 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Prototype summary</p>
            <h2 className="text-3xl font-bold mt-2">Structured around the main CRM flow</h2>
            <p className="text-gray-600 mt-3 max-w-2xl">
              This version keeps the interface intentionally plain so survey participants focus on layout,
              information hierarchy, and navigation rather than visual styling.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <WireBlock label="Login and access" className="h-20 flex items-center justify-center text-center" />
              <WireBlock label="Overview dashboard" className="h-20 flex items-center justify-center text-center" />
              <WireBlock label="Customer workflow" className="h-20 flex items-center justify-center text-center" />
            </div>
          </div>

          <aside className="rounded-3xl border border-gray-300 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Survey prompts</p>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              <li className="rounded-lg border border-dashed border-gray-300 p-3">1. Which screen feels easiest to understand?</li>
              <li className="rounded-lg border border-dashed border-gray-300 p-3">2. Where would you expect to click first?</li>
              <li className="rounded-lg border border-dashed border-gray-300 p-3">3. What information is missing?</li>
            </ul>
          </aside>
        </section>

        <section id="screens" className="space-y-6">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Screens</p>
              <h2 className="text-2xl font-bold mt-1">Wireframe views</h2>
            </div>
            <p className="text-sm text-gray-500">Each screen highlights structure, not color or branding.</p>
          </div>

          <div className="grid gap-6">
            {screens.map((screen, index) => (
              <div key={screen.id} id={screen.id} className="scroll-mt-24">
                <div className="grid gap-3 md:grid-cols-[220px_1fr] items-start">
                  <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Screen {index + 1}</p>
                    <h3 className="text-xl font-semibold mt-1">{screen.title}</h3>
                    <p className="text-sm text-gray-600 mt-2">{screen.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
                      {screen.blocks.map(block => (
                        <span key={block} className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1">
                          {block}
                        </span>
                      ))}
                    </div>
                  </div>

                  <WireFrame
                    title={screen.title}
                    description={screen.description}
                    blocks={screen.blocks}
                    accent={index % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}