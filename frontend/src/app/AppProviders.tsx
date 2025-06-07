import { PropsWithChildren, useEffect } from 'react';

import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { bootstrapAuthSession } from '../features/auth/authSession';
import { AppErrorBoundary } from '../shared/errors/AppErrorBoundary';
import { GlobalErrorBanner } from '../shared/errors/GlobalErrorBanner';
import { store } from '../shared/store';

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    bootstrapAuthSession();
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <NavigationContainer theme={DarkTheme}>{children}</NavigationContainer>
          <GlobalErrorBanner />
        </AppErrorBoundary>
      </SafeAreaProvider>
    </Provider>
  );
}
