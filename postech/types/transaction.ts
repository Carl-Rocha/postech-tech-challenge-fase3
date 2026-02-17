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
  userId: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: Date | string;
  createdAt?: any;
  updatedAt?: any;
  imageUri?: string | null;
  imageType?: 'image' | 'pdf' | null;
  fileName?: string | null;
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

