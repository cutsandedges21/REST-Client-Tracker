import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthGuard } from './components/AuthGuard'
import { RouteTransition } from './components/RouteTransition'
import { Landing } from './pages/Landing'
import { LoginScreen } from './components/LoginScreen'
import { AuthedApp } from './AuthedApp'

function RootLayout() {
  return (
    <ThemeProvider>
      <RouteTransition />
    </ThemeProvider>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'login', element: <LoginScreen mode="login" /> },
      { path: 'signup', element: <LoginScreen mode="signup" /> },
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
