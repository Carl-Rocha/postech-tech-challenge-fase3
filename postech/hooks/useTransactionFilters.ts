import { useState, useCallback } from 'react';
import { TransactionFilters } from '@/types/transaction';

export function useTransactionFilters(initialFilters?: TransactionFilters) {
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters || {});

  const updateFilters = useCallback((newFilters: TransactionFilters) => {
    setFilters(newFilters);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
}
