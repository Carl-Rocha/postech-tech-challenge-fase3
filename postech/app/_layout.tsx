import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { TransactionsProvider } from '@/context/TransactionsContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, 
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TransactionsProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'default', 
            }}
          />
        </TransactionsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}