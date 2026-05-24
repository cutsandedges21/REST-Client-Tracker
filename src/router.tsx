import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { AuthGuard } from './components/AuthGuard'
import { RouteTransition } from './components/RouteTransition'
import { Landing } from './pages/Landing'
import { LoginScreen } from './components/LoginScreen'
import { AuthCallback } from './pages/AuthCallback'
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
      // Home/landing page hidden — redirect to login first.
      // Landing kept imported below so the code stays available to un-hide later.
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'login', element: <LoginScreen mode="login" /> },
      // Signup hidden — only a login page is exposed. Route preserved but redirected.
      { path: 'signup', element: <Navigate to="/login" replace /> },
      { path: 'auth/callback', element: <AuthCallback /> },
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
