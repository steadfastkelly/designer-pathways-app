import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { SyncProvider } from './contexts/SyncContext';
import { router } from './routes';

export function App() {
  return (
    <SyncProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </SyncProvider>
  );
}
