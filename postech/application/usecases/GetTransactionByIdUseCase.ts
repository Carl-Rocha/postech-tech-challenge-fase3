import { TransactionsRepository } from '@/domain/repositories/TransactionsRepository';

export class GetTransactionByIdUseCase {
  constructor(private readonly repository: TransactionsRepository) {}

  execute(userId: string, transactionId: string) {
    return this.repository.getTransactionById(userId, transactionId);
  }
}
