import { useEffect, useState } from 'react';
import { TransactionFilters } from '@/types/transaction';
import { SubscribeToTransactionsUseCase } from '@/application/usecases/SubscribeToTransactionsUseCase';
import { transactionsRepository } from '@/infrastructure/repositories';

const subscribeToTransactionsUseCase = new SubscribeToTransactionsUseCase(transactionsRepository);

export function useTransactionRealtimeSignal(
  userId: string | null | undefined,
  filters: TransactionFilters
) {
  const [signal, setSignal] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToTransactionsUseCase.execute(userId, filters, () => {
      setSignal((prev) => prev + 1);
    });

    return unsubscribe;
  }, [filters, userId]);

  return signal;
}
