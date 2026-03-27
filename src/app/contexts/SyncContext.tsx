import React, { createContext, useContext, useState, useCallback } from 'react';

interface SyncContextValue {
  syncVersion: number;
  bumpSyncVersion: () => void;
}

const SyncContext = createContext<SyncContextValue>({ syncVersion: 0, bumpSyncVersion: () => {} });

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [syncVersion, setSyncVersion] = useState(0);
  const bumpSyncVersion = useCallback(() => setSyncVersion(v => v + 1), []);
  return (
    <SyncContext.Provider value={{ syncVersion, bumpSyncVersion }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncVersion(): number {
  return useContext(SyncContext).syncVersion;
}

export function useBumpSyncVersion(): () => void {
  return useContext(SyncContext).bumpSyncVersion;
}
