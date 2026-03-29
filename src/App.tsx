import './index.css'
import { Dashboard } from './components/Dashboard'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen w-full p-4 sm:p-6 md:p-8">
        <Dashboard />
      </div>
    </ErrorBoundary>
  )
}

export default App
