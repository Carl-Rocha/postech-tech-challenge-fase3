import { Transaction, TransactionFilters } from '@/types/transaction';

export type TransactionCursor = unknown;

export type GetTransactionsPageInput = {
  userId: string;
  filters: TransactionFilters;
  cursor: TransactionCursor | null;
  pageSize: number;
};

export type GetTransactionsPageOutput = {
  data: Transaction[];
  cursor: TransactionCursor | null;
};

export type UpsertTransactionInput = {
  userId: string;
  description: string;
  amount: number;
  type: Transaction['type'];
  category: Transaction['category'];
  date: Date;
  imageUri?: string;
  imageType?: Transaction['imageType'];
  fileName?: string | null;
};

export interface TransactionsRepository {
  getTransactionsPage(input: GetTransactionsPageInput): Promise<GetTransactionsPageOutput>;
  countTransactions(userId: string, filters: TransactionFilters): Promise<number>;
  getAllTransactions(userId: string, filters: TransactionFilters): Promise<Transaction[]>;
  subscribeToTransactions(
    userId: string,
    filters: TransactionFilters,
    onChange: () => void
  ): () => void;
  getTransactionById(userId: string, transactionId: string): Promise<Transaction | null>;
  createTransaction(input: UpsertTransactionInput): Promise<void>;
  updateTransaction(transactionId: string, input: UpsertTransactionInput): Promise<void>;
}
