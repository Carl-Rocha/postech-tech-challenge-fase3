import { TransactionFilters } from '@/types/transaction';
import {
  TransactionCursor,
  TransactionsRepository,
} from '@/domain/repositories/TransactionsRepository';

export type GetTransactionsPageParams = {
  userId: string;
  filters: TransactionFilters;
  cursor: TransactionCursor | null;
  pageSize: number;
};

export class GetTransactionsPageUseCase {
  constructor(private readonly repository: TransactionsRepository) {}

  execute(params: GetTransactionsPageParams) {
    return this.repository.getTransactionsPage(params);
  }
}
