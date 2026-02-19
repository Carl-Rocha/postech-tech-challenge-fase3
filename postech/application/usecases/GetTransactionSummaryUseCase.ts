import { TransactionFilters, TransactionSummary } from '@/types/transaction';
import { TransactionsRepository } from '@/domain/repositories/TransactionsRepository';

const EMPTY_SUMMARY: TransactionSummary = {
  totalBalance: 0,
  totalIncome: 0,
  totalExpense: 0,
};

export class GetTransactionSummaryUseCase {
  constructor(private readonly repository: TransactionsRepository) {}

  async execute(userId: string, filters: TransactionFilters): Promise<TransactionSummary> {
    const allTransactions = await this.repository.getAllTransactions(userId, filters);
    const searchText = filters.search?.toLowerCase();
    const filtered = searchText
      ? allTransactions.filter((transaction) =>
          transaction.description.toLowerCase().includes(searchText)
        )
      : allTransactions;

    const totalIncome = filtered
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const totalExpense = filtered
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      totalBalance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
    };
  }

  empty(): TransactionSummary {
    return EMPTY_SUMMARY;
  }
}
