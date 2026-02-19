import { useState, useCallback, useRef } from 'react';
import { Transaction, TransactionFilters } from '@/types/transaction';
import { TransactionCursor } from '@/domain/repositories/TransactionsRepository';
import { transactionsRepository } from '@/infrastructure/repositories';
import { GetTransactionsPageUseCase } from '@/application/usecases/GetTransactionsPageUseCase';
import { GetTransactionsCountUseCase } from '@/application/usecases/GetTransactionsCountUseCase';
import { SearchTransactionsUseCase } from '@/application/usecases/SearchTransactionsUseCase';

const ITEMS_PER_PAGE = 20;

const getTransactionsPageUseCase = new GetTransactionsPageUseCase(transactionsRepository);
const getTransactionsCountUseCase = new GetTransactionsCountUseCase(transactionsRepository);
const searchTransactionsUseCase = new SearchTransactionsUseCase(transactionsRepository);

export function useTransactionPagination(
  userId: string | null | undefined,
  filters: TransactionFilters
) {
  const [displayedTransactions, setDisplayedTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const lastDocRef = useRef<TransactionCursor | null>(null);
  const searchCacheRef = useRef<Transaction[] | null>(null);

  const resetState = useCallback(() => {
    setDisplayedTransactions([]);
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
        // local com cache
        if (filters.search) {
          if (!searchCacheRef.current || page === 1) {
            const result = await searchTransactionsUseCase.execute(
              userId,
              filters,
              page,
              ITEMS_PER_PAGE
            );
            searchCacheRef.current = result.all;
            setTotalCount(result.total);
            setHasMore(result.data.length < result.total);
            setDisplayedTransactions(result.data);
            setCurrentPage(page);
            return;
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

        // paginacao
        if (page === 1) {
          lastDocRef.current = null;
          searchCacheRef.current = null;
        }

        const { data, cursor } = await getTransactionsPageUseCase.execute({
          userId,
          filters,
          cursor: append ? lastDocRef.current : null,
          pageSize: ITEMS_PER_PAGE,
        });
        lastDocRef.current = cursor;

        if (append) {
          setDisplayedTransactions((prev) => [...prev, ...data]);
        } else {
          setDisplayedTransactions(data);
        }

        if (page === 1) {
          const total = await getTransactionsCountUseCase.execute(userId, filters);
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

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || isLoading) return;
    loadTransactions(currentPage + 1, true);
  }, [currentPage, hasMore, isLoadingMore, isLoading, loadTransactions]);

  const refetch = useCallback(() => {
    setCurrentPage(1);
    setDisplayedTransactions([]);
    setHasMore(true);
    lastDocRef.current = null;
    searchCacheRef.current = null;
    loadTransactions(1, false);
  }, [loadTransactions]);

  return {
    displayedTransactions,
    currentPage,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    error,
    loadTransactions,
    loadMore,
    refetch,
    resetState,
  };
}
