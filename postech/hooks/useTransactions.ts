import { useEffect, useCallback } from 'react';
import { TransactionFilters } from '@/types/transaction';
import { useTransactionFilters } from './useTransactionFilters';
import { useTransactionPagination } from './useTransactionPagination';
import { useTransactionSummary } from './useTransactionSummary';
import { useTransactionRealtimeSignal } from './useTransactionRealtimeSignal';

export function useTransactions(userId?: string | null, initialFilters?: TransactionFilters) {
  const { filters, updateFilters } = useTransactionFilters(initialFilters);

  const {
    displayedTransactions,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    error,
    loadTransactions,
    loadMore,
    refetch: refetchPagination,
    resetState,
  } = useTransactionPagination(userId, filters);

  // rresumo financeiro
  const { summary, loadSummary } = useTransactionSummary(userId, filters);
  const realtimeSignal = useTransactionRealtimeSignal(userId, filters);

  // atualiza filtros e reseta paginação
  const handleUpdateFilters = useCallback(
    (newFilters: TransactionFilters) => {
      updateFilters(newFilters);
    },
    [updateFilters]
  );

  // paginacao e resumo
  const refetch = useCallback(() => {
    refetchPagination();
    loadSummary();
  }, [refetchPagination, loadSummary]);

  useEffect(() => {
    if (!userId) {
      resetState();
      return;
    }

    loadTransactions(1, false);
    loadSummary();
  }, [filters, loadTransactions, loadSummary, realtimeSignal, userId, resetState]);

  return {
    transactions: displayedTransactions,
    summary,
    filters,
    updateFilters: handleUpdateFilters,
    loadMore,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    error,
    refetch,
  };
}
