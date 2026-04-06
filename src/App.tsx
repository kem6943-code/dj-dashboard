import { Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { Dashboard } from './components/Dashboard'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoginPage } from './components/LoginPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div style={{ padding: '0px', boxSizing: 'border-box', minHeight: '100vh', width: '100%' }}>
                <Dashboard />
              </div>
            </ProtectedRoute>
          } />
          {/* 기본 경로는 무조건 login 페이지로 향하고, 로그인되어있으면 dashboard로 가도록 설정 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
