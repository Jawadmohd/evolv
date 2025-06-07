import { useCallback, useEffect, useState } from 'react';

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import {
  googleAuthConfig,
  isGoogleAuthConfigured,
} from '../../../shared/config/googleAuth';
import { parseApiError } from '../../../shared/errors/parseApiError';
import { completeAuthSession } from '../authSession';
import { useGoogleLoginMutation } from '../services/authApi';

WebBrowser.maybeCompleteAuthSession();

type GoogleSignInResult = {
  ready: boolean;
  configured: boolean;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
};

export function useGoogleSignIn(): GoogleSignInResult {
  const configured = isGoogleAuthConfigured();
  const [googleLogin, { isLoading: isExchanging }] = useGoogleLoginMutation();
  const [error, setError] = useState<string | null>(null);
  const [isPrompting, setIsPrompting] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: googleAuthConfig.webClientId || undefined,
    iosClientId: googleAuthConfig.iosClientId || undefined,
    androidClientId: googleAuthConfig.androidClientId || undefined,
  });

  useEffect(() => {
    const exchange = async () => {
      if (response?.type !== 'success') {
        if (response?.type === 'error') {
          setError('Google sign-in failed. Please try again.');
        }
        return;
      }

      const idToken = response.params.id_token;
      if (!idToken) {
        setError('Google did not return an ID token.');
        return;
      }

      try {
        setError(null);
        const tokens = await googleLogin({ idToken }).unwrap();
        const sessionReady = await completeAuthSession(tokens);
        if (!sessionReady) {
          setError('Signed in with Google, but failed to load your account.');
        }
      } catch (err) {
        setError(parseApiError(err, 'Unable to sign in with Google.'));
      }
    };

    void exchange();
  }, [response, googleLogin]);

  const signInWithGoogle = useCallback(async () => {
    if (!configured) {
      setError(
        'Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.'
      );
      return;
    }

    if (!request) {
      setError('Google sign-in is still loading. Try again in a moment.');
      return;
    }

    try {
      setError(null);
      setIsPrompting(true);
      await promptAsync();
    } catch {
      setError('Unable to open Google sign-in.');
    } finally {
      setIsPrompting(false);
    }
  }, [configured, promptAsync, request]);

  return {
    ready: Boolean(request) || !configured,
    configured,
    loading: isPrompting || isExchanging,
    error,
    signInWithGoogle,
  };
}
