import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider, useAuth } from './context/AuthContext'
import Dashboard    from './pages/Dashboard'
import History      from './pages/History'
import HistoryDetail from './pages/HistoryDetail'
import Login        from './pages/Login'
import Processing   from './pages/Processing'
import Results      from './pages/Results'
import Settings     from './pages/Settings'
import Upload       from './pages/Upload'
import UserStats    from './pages/UserStats'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"                       element={<Navigate to="/dashboard" replace />} />
      <Route path="/login"                  element={<Login />} />
      <Route path="/dashboard"              element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/upload"                 element={<ProtectedRoute><Upload /></ProtectedRoute>} />
      <Route path="/processing"             element={<ProtectedRoute><Processing /></ProtectedRoute>} />
      <Route path="/results/:caseId"        element={<ProtectedRoute><Results /></ProtectedRoute>} />
      <Route path="/history"                element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/history/:caseId"        element={<ProtectedRoute><HistoryDetail /></ProtectedRoute>} />
      <Route path="/settings"               element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/settings/users/:userId" element={<ProtectedRoute><UserStats /></ProtectedRoute>} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App