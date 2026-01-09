import { useState, useEffect, useCallback, useRef } from 'react';
import { Transaction, TransactionFilters, TransactionSummary } from '@/types/transaction';
import {
  collection,
  getCountFromServer,
  getDocs,
  orderBy,
  query,
  startAfter,
  where,
  limit,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';

const ITEMS_PER_PAGE = 20;

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

const fetchTransactionPage = async (
  filters: TransactionFilters,
  userId: string,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
): Promise<{
  data: Transaction[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
}> => {
  let q = buildBaseQuery(filters, userId);
  q = query(q, limit(ITEMS_PER_PAGE));
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(mapDocToTransaction);
  const lastVisible = snapshot.docs[snapshot.docs.length - 1] ?? null;
  return { data, lastVisible };
};

const fetchTransactionsCount = async (filters: TransactionFilters, userId: string): Promise<number> => {
  const q = buildBaseQuery(filters, userId);
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
};

// buscar todas as transacoes (para calculo e busca local)
const fetchAllTransactions = async (filters: TransactionFilters, userId: string): Promise<Transaction[]> => {
  const q = buildBaseQuery(filters, userId);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDocToTransaction);
};

export function useTransactions(userId?: string | null, initialFilters?: TransactionFilters) {
  const [displayedTransactions, setDisplayedTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters || {});
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState<TransactionSummary>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const searchCacheRef = useRef<Transaction[] | null>(null);

  const calculateSummary = useCallback((transactions: Transaction[]): TransactionSummary => {
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
  }, []);

  const resetState = useCallback(() => {
    setDisplayedTransactions([]);
    setSummary({ totalBalance: 0, totalIncome: 0, totalExpense: 0 });
    setTotalCount(0);
    setHasMore(false);
    setCurrentPage(1);
    setError(null);
    setIsLoading(false);
    setIsLoadingMore(false);
    lastDocRef.current = null;
    searchCacheRef.current = null;
  }, []);

  const loadTransactions = useCallback(
    async (page: number, append: boolean = false) => {
      if (!userId) {
        resetState();
        return;
      }

      const loadingState = page === 1 ? setIsLoading : setIsLoadingMore;
      loadingState(true);
      setError(null);

      try {
        if (filters.search) {
          if (!searchCacheRef.current || page === 1) {
            const allTransactions = await fetchAllTransactions(filters, userId);
            const searchLower = filters.search.toLowerCase();
            searchCacheRef.current = allTransactions.filter((transaction) =>
              transaction.description.toLowerCase().includes(searchLower)
            );
          }

          const filtered = searchCacheRef.current || [];
          const sliceEnd = page * ITEMS_PER_PAGE;
          const sliced = filtered.slice(0, sliceEnd);
          setDisplayedTransactions(sliced);
          setTotalCount(filtered.length);
          setHasMore(sliced.length < filtered.length);
          setCurrentPage(page);
          return;
        }

        if (page === 1) {
          lastDocRef.current = null;
          searchCacheRef.current = null;
        }

        const { data, lastVisible } = await fetchTransactionPage(
          filters,
          userId,
          append ? lastDocRef.current : null
        );
        lastDocRef.current = lastVisible;

        if (append) {
          setDisplayedTransactions((prev) => [...prev, ...data]);
        } else {
          setDisplayedTransactions(data);
        }

        if (page === 1) {
          const total = await fetchTransactionsCount(filters, userId);
          setTotalCount(total);
          setHasMore(data.length === ITEMS_PER_PAGE && data.length < total);
        } else {
          const nextLength = displayedTransactions.length + data.length;
          setHasMore(data.length === ITEMS_PER_PAGE && nextLength < totalCount);
        }

        setCurrentPage(page);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar transacoes');
        console.error('Error loading transactions:', err);
      } finally {
        loadingState(false);
      }
    },
    [filters, displayedTransactions.length, totalCount, userId, resetState]
  );

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
  }, [filters, calculateSummary, userId]);

  const updateFilters = useCallback((newFilters: TransactionFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setDisplayedTransactions([]);
    setHasMore(true);
    lastDocRef.current = null;
    searchCacheRef.current = null;
  }, []);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || isLoading) return;
    loadTransactions(currentPage + 1, true);
  }, [currentPage, hasMore, isLoadingMore, isLoading, loadTransactions]);

  useEffect(() => {
    if (!userId) {
      resetState();
      return;
    }

    loadTransactions(1, false);
    loadSummary();
  }, [filters, loadTransactions, loadSummary, userId, resetState]);

  return {
    transactions: displayedTransactions,
    summary,
    filters,
    updateFilters,
    loadMore,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    error,
    refetch: () => {
      setCurrentPage(1);
      setDisplayedTransactions([]);
      setHasMore(true);
      lastDocRef.current = null;
      searchCacheRef.current = null;
      loadTransactions(1, false);
      loadSummary();
    },
  };
}
