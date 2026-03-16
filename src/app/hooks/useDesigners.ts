import { useState, useEffect } from 'react';
import { getAllProfiles, getProfile } from '../lib/api';
import type { Profile } from '../types';

export function useDesigners() {
  const [designers, setDesigners] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllProfiles()
      .then(profiles => {
        setDesigners(profiles.filter(p => p.isActive && p.role === 'designer'));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { designers, loading, error };
}

export function useDesigner(id: string | undefined) {
  const [designer, setDesigner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getProfile(id)
      .then(p => setDesigner(p))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { designer, loading, error };
}
