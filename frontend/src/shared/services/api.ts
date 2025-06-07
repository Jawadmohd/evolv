import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';

import { clearCredentials, setCredentials, setUser } from '../../features/auth/store/authSlice';
import { parseApiError } from '../errors/parseApiError';
import { showError } from '../errors/errorSlice';
import type { ApiExtraOptions } from '../errors/types';
import type { RootState } from '../store';
import { tokenStorage } from '../storage/tokenStorage';
import { apiUrl } from '../config/apiUrl';

type Tokens = { accessToken: string; refreshToken: string };

let pendingRefresh: { token: string; work: Promise<boolean> } | undefined;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiUrl,
  prepareHeaders: (headers, { getState }) => {
    const accessToken = (getState() as RootState).auth.accessToken;
    if (accessToken) {
      headers.set('authorization', `Bearer ${accessToken}`);
    }

    headers.set('content-type', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  ApiExtraOptions
> = async (args, api, extraOptions) => {
  const originalSession = (api.getState() as RootState).auth;
  let result = await rawBaseQuery(args, api, extraOptions);

  const session = (api.getState() as RootState).auth;
  if (result.error?.status === 401 && session.user?.id === originalSession.user?.id) {
    const refreshToken = session.refreshToken;
    const requestUrl = typeof args === 'string' ? args : args.url;
    const isAuthEndpoint = requestUrl.startsWith('/auth/');

    if (!refreshToken || isAuthEndpoint) {
      if (!isAuthEndpoint) {
        await tokenStorage.clear();
        api.dispatch(clearCredentials());
        api.dispatch(setUser(null));
      }
    } else {
      if (session.accessToken && session.accessToken !== originalSession.accessToken) {
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        if (pendingRefresh?.token !== refreshToken) {
          const work = (async () => {
            const refreshApi = { ...api, signal: new AbortController().signal };
            const refreshed = await rawBaseQuery(
              { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
              refreshApi,
              extraOptions,
            );
            if ((api.getState() as RootState).auth.refreshToken !== refreshToken) return false;

            if (refreshed.data) {
              const tokens = refreshed.data as Tokens;
              await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
              api.dispatch(setCredentials(tokens));
              return true;
            }
            if (refreshed.error?.status === 401 || refreshed.error?.status === 403) {
              await tokenStorage.clear();
              api.dispatch(clearCredentials());
            }
            return false;
          })().finally(() => {
            if (pendingRefresh?.token === refreshToken) pendingRefresh = undefined;
          });
          pendingRefresh = { token: refreshToken, work };
        }
        if (await pendingRefresh.work) {
          result = await rawBaseQuery(args, api, extraOptions);
        }
      }
    }
  }

  if (result.error && !extraOptions?.skipGlobalError) {
    api.dispatch(showError(parseApiError(result.error)));
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'User', 'Todo', 'Challenge', 'Learning', 'QuizRank'],
  endpoints: () => ({}),
});
