import { TransactionFilters } from '@/types/transaction';
import { TransactionsRepository } from '@/domain/repositories/TransactionsRepository';

export class SubscribeToTransactionsUseCase {
  constructor(private readonly repository: TransactionsRepository) {}

  execute(userId: string, filters: TransactionFilters, onChange: () => void): () => void {
    return this.repository.subscribeToTransactions(userId, filters, onChange);
  }
}
