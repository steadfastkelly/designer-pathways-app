import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { PreviewBanner } from './PreviewBanner';

export function AppLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', overflow: 'hidden' }}>
      <Navigation />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PreviewBanner />
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
