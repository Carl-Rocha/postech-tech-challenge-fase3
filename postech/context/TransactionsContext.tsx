import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Transaction } from '@/types/transaction';
import { db } from '@/services/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';

interface TransactionsContextData {
  transactions: Transaction[];
  summary: {
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
  };
  isLoading: boolean;
  refetch: () => void;
  error: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  totalCount: number;
  loadMore: () => void;
  updateFilters: (filters: any) => void;
}

const TransactionsContext = createContext<TransactionsContextData | undefined>(undefined);

const fetchAllTransactionsForBalance = async (userId: string) => {
  const transactionsRef = collection(db, 'transactions');
  const q = query(
    transactionsRef,
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date instanceof Timestamp ? doc.data().date.toDate() : new Date(doc.data().date),
  })) as Transaction[];
};

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { data: transactions = [], isLoading, refetch, isError } = useQuery({
    queryKey: ['transactions', 'all', user?.uid],
    queryFn: () => {
      if (!user?.uid) return Promise.resolve([]);
      return fetchAllTransactionsForBalance(user.uid);
    },
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5,
  });

  const summary = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.totalIncome += transaction.amount;
          acc.totalBalance += transaction.amount;
        } else {
          acc.totalExpense += transaction.amount;
          acc.totalBalance -= transaction.amount;
        }
        return acc;
      },
      { totalBalance: 0, totalIncome: 0, totalExpense: 0 }
    );
  }, [transactions]);
  const loadMore = () => {}; 
  const updateFilters = () => {};

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        summary,      
        isLoading,
        refetch,
        error: isError ? 'Erro ao carregar saldo' : null,
        hasMore: false,
        isLoadingMore: false,
        totalCount: transactions.length,
        loadMore,
        updateFilters,
      }}>
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