import { useState, useCallback } from 'react';
import { TransactionFilters, TransactionSummary } from '@/types/transaction';
import { transactionsRepository } from '@/infrastructure/repositories';
import { GetTransactionSummaryUseCase } from '@/application/usecases/GetTransactionSummaryUseCase';

const getTransactionSummaryUseCase = new GetTransactionSummaryUseCase(transactionsRepository);

export function useTransactionSummary(
  userId: string | null | undefined,
  filters: TransactionFilters
) {
  const [summary, setSummary] = useState<TransactionSummary>(getTransactionSummaryUseCase.empty());

  const loadSummary = useCallback(async () => {
    if (!userId) {
      setSummary(getTransactionSummaryUseCase.empty());
      return;
    }

    try {
      const calculatedSummary = await getTransactionSummaryUseCase.execute(userId, filters);
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
