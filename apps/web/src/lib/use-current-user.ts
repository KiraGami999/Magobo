'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PublicUser } from '@magobo/shared';
import { apiGet } from './api-client';

export interface CurrentUserState {
  user: PublicUser | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

/** Client-side "who am I" hook, backed by `GET /api/auth/me`. */
export function useCurrentUser(): CurrentUserState {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  // No setState call happens synchronously in this function's call stack —
  // both `setUser` and `setLoading` only run after the `await` resolves —
  // so mounting the effect below never triggers a cascading render.
  const fetchUser = useCallback(async () => {
    const response = await apiGet<{ user: PublicUser }>('/api/auth/me');
    setUser(response.success ? response.data.user : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Deliberate fetch-on-mount to bootstrap session state. `fetchUser`
    // only calls setState after its network request resolves, so this
    // doesn't cause a synchronous cascading render — the linter can't see
    // through the `await` boundary, hence the explicit opt-out.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUser();
  }, [fetchUser]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchUser();
  }, [fetchUser]);

  return { user, loading, refetch };
}
