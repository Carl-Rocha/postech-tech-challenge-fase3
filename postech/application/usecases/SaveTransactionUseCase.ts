import { UpsertTransactionInput, TransactionsRepository } from '@/domain/repositories/TransactionsRepository';

export class SaveTransactionUseCase {
  constructor(private readonly repository: TransactionsRepository) {}

  create(input: UpsertTransactionInput) {
    return this.repository.createTransaction(input);
  }

  update(transactionId: string, input: UpsertTransactionInput) {
    return this.repository.updateTransaction(transactionId, input);
  }
}
