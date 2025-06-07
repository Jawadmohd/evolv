import { clearCredentials, setCredentials, setHydrated, setUser } from './store/authSlice';
import { store } from '../../shared/store';
import { tokenStorage } from '../../shared/storage/tokenStorage';

import { apiUrl } from '../../shared/config/apiUrl';

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
};

export async function bootstrapAuthSession() {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      tokenStorage.getAccessToken(),
      tokenStorage.getRefreshToken(),
    ]);

    if (!accessToken || !refreshToken) {
      await resetAuthState();
      return;
    }

    store.dispatch(setCredentials({ accessToken, refreshToken }));

    let user = await fetchCurrentUser(accessToken);

    if (!user) {
      const refreshedTokens = await refreshTokens(refreshToken);

      if (!refreshedTokens) {
        await resetAuthState();
        return;
      }

      await tokenStorage.setTokens(
        refreshedTokens.accessToken,
        refreshedTokens.refreshToken
      );
      store.dispatch(setCredentials(refreshedTokens));
      user = await fetchCurrentUser(refreshedTokens.accessToken);
    }

    if (!user) {
      await resetAuthState();
      return;
    }

    store.dispatch(setUser(user));
  } finally {
    store.dispatch(setHydrated(true));
  }
}

export async function completeAuthSession(tokens: AuthResponse) {
  await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
  store.dispatch(setCredentials(tokens));

  const user = await fetchCurrentUser(tokens.accessToken);
  if (user) {
    store.dispatch(setUser(user));
    return true;
  }

  await resetAuthState();
  return false;
}

export async function resetAuthState() {
  await tokenStorage.clear();
  store.dispatch(clearCredentials());
  store.dispatch(setUser(null));
}

async function refreshTokens(refreshToken: string): Promise<AuthResponse | null> {
  const response = await fetch(`${apiUrl}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as AuthResponse;
}

async function fetchCurrentUser(accessToken: string): Promise<AuthUser | null> {
  const response = await fetch(`${apiUrl}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as AuthUser;
}
