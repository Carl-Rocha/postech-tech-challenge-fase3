import React, { createContext, useContext } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/context/AuthContext';

type TransactionsContextValue = ReturnType<typeof useTransactions>;

const TransactionsContext = createContext<TransactionsContextValue | undefined>(undefined);

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const transactions = useTransactions(user?.uid);

  return (
    <TransactionsContext.Provider value={transactions}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactionsContext() {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error('useTransactionsContext must be used within TransactionsProvider');
  }
  return context;
}
