import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { TodayPage } from './pages/TodayPage';
import { TeamPage } from './pages/TeamPage';
import { DesignerProfilePage } from './pages/DesignerProfilePage';
import { HomebasePage } from './pages/HomebasePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { useAuth } from './hooks/useAuth';

function RootRedirect() {
  const { effectiveRole, loading } = useAuth();
  if (loading) return null;
  if (effectiveRole === 'admin' || effectiveRole === 'supervisor') return <Navigate to="/today" replace />;
  return <Navigate to="/homebase" replace />;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'supervisor', 'designer']}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <RootRedirect />,
      },
      {
        path: 'today',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
            <TodayPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'team',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
            <TeamPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'team/:id',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
            <DesignerProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'homebase',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'supervisor', 'designer']}>
            <HomebasePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
