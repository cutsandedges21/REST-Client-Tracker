import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { AuthGuard } from './components/AuthGuard'
import { RouteTransition } from './components/RouteTransition'
import { LoginScreen } from './components/LoginScreen'
import { AuthCallback } from './pages/AuthCallback'
import { UpdatePasswordPage } from './pages/UpdatePasswordPage'
import { TermsPage } from './pages/legal/TermsPage'
import { PrivacyPage } from './pages/legal/PrivacyPage'
import { AuthedApp } from './AuthedApp'

function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RouteTransition />
      </ThemeProvider>
    </AuthProvider>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'login', element: <LoginScreen mode="login" /> },
      // Signup hidden — only a login page is exposed. Route preserved but redirected.
      { path: 'signup', element: <Navigate to="/login" replace /> },
      { path: 'auth/callback', element: <AuthCallback /> },
      { path: 'auth/update-password', element: <UpdatePasswordPage /> },
      { path: 'legal/terms', element: <TermsPage /> },
      { path: 'legal/privacy', element: <PrivacyPage /> },
      {
        path: 'app/*',
        element: (
          <AuthGuard>
            <AuthedApp />
          </AuthGuard>
        ),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
