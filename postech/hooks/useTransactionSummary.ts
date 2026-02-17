import { useState, useCallback } from 'react';
import { Transaction, TransactionFilters, TransactionSummary } from '@/types/transaction';
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';

const parseDate = (value: unknown): Date => {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'string') return new Date(value);
  return new Date();
};

const buildBaseQuery = (filters: TransactionFilters, userId: string) => {
  let q = query(collection(db, 'transactions'), where('userId', '==', userId));

  if (filters.type) {
    q = query(q, where('type', '==', filters.type));
  }
  if (filters.category) {
    q = query(q, where('category', '==', filters.category));
  }
  if (filters.startDate) {
    q = query(q, where('date', '>=', filters.startDate));
  }
  if (filters.endDate) {
    q = query(q, where('date', '<=', filters.endDate));
  }

  return query(q, orderBy('date', 'desc'));
};

const mapDocToTransaction = (docSnap: QueryDocumentSnapshot<DocumentData>): Transaction => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    description: String(data.description || ''),
    amount: Number(data.amount || 0),
    type: data.type,
    category: data.category,
    date: parseDate(data.date),
    createdAt: parseDate(data.createdAt),
    imageUri: data.imageUri,
    imageType: data.imageType,
    fileName: data.fileName,
  };
};

const fetchAllTransactions = async (filters: TransactionFilters, userId: string): Promise<Transaction[]> => {
  const q = buildBaseQuery(filters, userId);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDocToTransaction);
};

const calculateSummary = (transactions: Transaction[]): TransactionSummary => {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalBalance: income - expense,
    totalIncome: income,
    totalExpense: expense,
  };
};

export function useTransactionSummary(
  userId: string | null | undefined,
  filters: TransactionFilters
) {
  const [summary, setSummary] = useState<TransactionSummary>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
  });

  const loadSummary = useCallback(async () => {
    if (!userId) {
      setSummary({ totalBalance: 0, totalIncome: 0, totalExpense: 0 });
      return;
    }

    try {
      const allTransactions = await fetchAllTransactions(filters, userId);
      const filteredTransactions = filters.search
        ? allTransactions.filter((transaction) =>
            transaction.description.toLowerCase().includes(filters.search!.toLowerCase())
          )
        : allTransactions;
      const calculatedSummary = calculateSummary(filteredTransactions);
      setSummary(calculatedSummary);
    } catch (err) {
      console.error('Error loading summary:', err);
    }
  }, [filters, userId]);

  return {
    summary,
    loadSummary,
  };
}
