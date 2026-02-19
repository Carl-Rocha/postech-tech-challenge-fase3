import { Transaction, TransactionFilters } from '@/types/transaction';
import { TransactionsRepository } from '@/domain/repositories/TransactionsRepository';

export type SearchTransactionsResult = {
  data: Transaction[];
  all: Transaction[];
  total: number;
};

export class SearchTransactionsUseCase {
  constructor(private readonly repository: TransactionsRepository) {}

  async execute(
    userId: string,
    filters: TransactionFilters,
    page: number,
    pageSize: number
  ): Promise<SearchTransactionsResult> {
    const allTransactions = await this.repository.getAllTransactions(userId, filters);
    const searchText = filters.search?.toLowerCase() ?? '';

    const filtered = allTransactions.filter((transaction) =>
      transaction.description.toLowerCase().includes(searchText)
    );

    return {
      data: filtered.slice(0, page * pageSize),
      all: filtered,
      total: filtered.length,
    };
  }
}
