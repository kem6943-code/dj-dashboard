import './index.css'
import { Dashboard } from './components/Dashboard'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <div style={{ padding: '24px', boxSizing: 'border-box', minHeight: '100vh', width: '100%' }}>
        <Dashboard />
      </div>
    </ErrorBoundary>
  )
}

export default App
