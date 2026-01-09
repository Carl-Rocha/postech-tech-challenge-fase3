import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { TransactionsProvider } from '@/context/TransactionsContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <TransactionsProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </TransactionsProvider>
    </AuthProvider>
  );
}

