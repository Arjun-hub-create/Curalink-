import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import Layout from './components/layout/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import ResearchPage from './pages/ResearchPage'
import ClinicalTrialsPage from './pages/ClinicalTrialsPage'
import AIChatPage from './pages/AIChatPage'
import BookmarksPage from './pages/BookmarksPage'
import ProfilePage from './pages/ProfilePage'
import ArticlePage from './pages/ArticlePage'
import TrialDetailPage from './pages/TrialDetailPage'
import UnifiedSearchPage from './pages/UnifiedSearchPage'
import StructuredSearchPage from './pages/StructuredSearchPage'

const PrivateRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  const fetchMe = useAuthStore(s => s.fetchMe)
  useEffect(() => { fetchMe() }, [])

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="unified" element={<UnifiedSearchPage />} />
        <Route path="structured" element={<StructuredSearchPage />} />
        <Route path="research" element={<ResearchPage />} />
        <Route path="research/:pmid" element={<ArticlePage />} />
        <Route path="trials" element={<ClinicalTrialsPage />} />
        <Route path="trials/:nctId" element={<TrialDetailPage />} />
        <Route path="chat" element={<AIChatPage />} />
        <Route path="bookmarks" element={<BookmarksPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
