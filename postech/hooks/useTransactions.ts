import { useState, useEffect, useCallback } from 'react';
import { Transaction, TransactionFilters, TransactionSummary } from '@/types/transaction';
import { API_ENDPOINTS } from '@/config/api';

const ITEMS_PER_PAGE = 20;

// Função para converter string de data para Date
const parseDate = (dateString: string | Date): Date => {
  if (dateString instanceof Date) return dateString;
  return new Date(dateString);
};

// Função para formatar data para query string
const formatDateForQuery = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Função para construir query string de filtros
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
  
  // Paginação
  params.append('_page', page.toString());
  params.append('_limit', limit.toString());
  params.append('_sort', 'date');
  params.append('_order', 'desc');
  
  return params.toString();
};

// Função para buscar transações da API
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
    
    // Converter strings de data para objetos Date
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

// Função para buscar todas as transações (para cálculo de resumo)
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
    
    // Converter strings de data para objetos Date
    const transactions = data.map((transaction) => ({
      ...transaction,
      date: parseDate(transaction.date),
      createdAt: parseDate(transaction.createdAt),
    }));
    
    // Aplicar filtro de busca no cliente (JSON Server não suporta busca em texto completo)
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

  // Calcular resumo
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

  // Carregar transações da API
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

  // Carregar resumo
  const loadSummary = useCallback(async () => {
    try {
      const allTransactions = await fetchAllTransactions(filters);
      const calculatedSummary = calculateSummary(allTransactions);
      setSummary(calculatedSummary);
    } catch (err) {
      console.error('Error loading summary:', err);
    }
  }, [filters, calculateSummary]);

  // Atualizar filtros e resetar paginação
  const updateFilters = useCallback((newFilters: TransactionFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setDisplayedTransactions([]);
    setHasMore(true);
  }, []);

  // Carregar mais transações (scroll infinito)
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || isLoading) return;
    loadTransactions(currentPage + 1, true);
  }, [currentPage, hasMore, isLoadingMore, isLoading, loadTransactions]);

  // Efeito para carregar transações quando os filtros mudarem
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
