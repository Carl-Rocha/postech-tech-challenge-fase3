import { useState, useEffect, useCallback } from 'react';
import { Transaction, TransactionFilters, TransactionSummary } from '@/types/transaction';
import { API_ENDPOINTS } from '@/config/api';

const ITEMS_PER_PAGE = 20;

const parseDate = (dateString: string | Date): Date => {
  if (dateString instanceof Date) return dateString;
  return new Date(dateString);
};

const formatDateForQuery = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// construir query string de filtros
const buildQueryString = (filters: TransactionFilters, page: number, limit: number): string => {
  const params = new URLSearchParams();
  
  if (filters.startDate) {
    params.append('date_gte', formatDateForQuery(filters.startDate));
  }
  if (filters.endDate) {
    params.append('date_lte', formatDateForQuery(filters.endDate));
  }
  if (filters.category) {
    params.append('category', filters.category);
  }
  if (filters.type) {
    params.append('type', filters.type);
  }
  if (filters.search) {
    params.append('q', filters.search);
  }
  
  params.append('_page', page.toString());
  params.append('_limit', limit.toString());
  params.append('_sort', 'date');
  params.append('_order', 'desc');
  
  return params.toString();
};

// buscar transacoes
const fetchTransactions = async (
  filters: TransactionFilters,
  page: number
): Promise<{ data: Transaction[]; total: number }> => {
  try {
    const queryString = buildQueryString(filters, page, ITEMS_PER_PAGE);
    const url = `${API_ENDPOINTS.transactions}?${queryString}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: Transaction[] = await response.json();
    const total = response.headers.get('X-Total-Count') 
      ? parseInt(response.headers.get('X-Total-Count') || '0', 10)
      : data.length;
    
    const transactions = data.map((transaction) => ({
      ...transaction,
      date: parseDate(transaction.date),
      createdAt: parseDate(transaction.createdAt),
    }));
    
    return { data: transactions, total };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

// buscar todas as transacoes (para calculo)
const fetchAllTransactions = async (filters: TransactionFilters): Promise<Transaction[]> => {
  try {
    const params = new URLSearchParams();
    
    if (filters.startDate) {
      params.append('date_gte', formatDateForQuery(filters.startDate));
    }
    if (filters.endDate) {
      params.append('date_lte', formatDateForQuery(filters.endDate));
    }
    if (filters.category) {
      params.append('category', filters.category);
    }
    if (filters.type) {
      params.append('type', filters.type);
    }
    
    const url = `${API_ENDPOINTS.transactions}?${params.toString()}&_sort=date&_order=desc`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: Transaction[] = await response.json();
    
    const transactions = data.map((transaction) => ({
      ...transaction,
      date: parseDate(transaction.date),
      createdAt: parseDate(transaction.createdAt),
    }));
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return transactions.filter((transaction) =>
        transaction.description.toLowerCase().includes(searchLower)
      );
    }
    
    return transactions;
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    throw error;
  }
};

export function useTransactions(initialFilters?: TransactionFilters) {
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

  const loadTransactions = useCallback(
    async (page: number, append: boolean = false) => {
      const loadingState = page === 1 ? setIsLoading : setIsLoadingMore;
      loadingState(true);
      setError(null);

      try {
        const { data, total } = await fetchTransactions(filters, page);

        if (append) {
          setDisplayedTransactions((prev) => [...prev, ...data]);
        } else {
          setDisplayedTransactions(data);
        }

        setTotalCount(total);
        setHasMore(data.length === ITEMS_PER_PAGE && displayedTransactions.length + data.length < total);
        setCurrentPage(page);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar transações');
        console.error('Error loading transactions:', err);
      } finally {
        loadingState(false);
      }
    },
    [filters, displayedTransactions.length]
  );

  const loadSummary = useCallback(async () => {
    try {
      const allTransactions = await fetchAllTransactions(filters);
      const calculatedSummary = calculateSummary(allTransactions);
      setSummary(calculatedSummary);
    } catch (err) {
      console.error('Error loading summary:', err);
    }
  }, [filters, calculateSummary]);

  const updateFilters = useCallback((newFilters: TransactionFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setDisplayedTransactions([]);
    setHasMore(true);
  }, []);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || isLoading) return;
    loadTransactions(currentPage + 1, true);
  }, [currentPage, hasMore, isLoadingMore, isLoading, loadTransactions]);

  useEffect(() => {
    loadTransactions(1, false);
    loadSummary();
  }, [filters, loadTransactions, loadSummary]);

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
      loadTransactions(1, false);
      loadSummary();
    },
  };
}
