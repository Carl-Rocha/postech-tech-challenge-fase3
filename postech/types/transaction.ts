export type TransactionType = 'income' | 'expense';
export type TransactionCategory = 
  | 'alimentacao'
  | 'transporte'
  | 'saude'
  | 'educacao'
  | 'lazer'
  | 'moradia'
  | 'salario'
  | 'outros';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: Date;
  createdAt: Date;
}

export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  category?: TransactionCategory;
  type?: TransactionType;
  search?: string;
}

export interface TransactionSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}

