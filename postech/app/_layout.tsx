import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { TransactionsProvider } from '@/context/TransactionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TransactionsProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </TransactionsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

