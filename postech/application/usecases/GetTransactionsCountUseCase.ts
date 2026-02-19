import { TransactionFilters } from '@/types/transaction';
import { TransactionsRepository } from '@/domain/repositories/TransactionsRepository';

export class GetTransactionsCountUseCase {
  constructor(private readonly repository: TransactionsRepository) {}

  execute(userId: string, filters: TransactionFilters) {
    return this.repository.countTransactions(userId, filters);
  }
}
