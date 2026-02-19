import {
  addDoc,
  collection,
  deleteField,
  DocumentData,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  GetTransactionsPageInput,
  GetTransactionsPageOutput,
  UpsertTransactionInput,
  TransactionCursor,
  TransactionsRepository,
} from '@/domain/repositories/TransactionsRepository';
import { Transaction, TransactionFilters } from '@/types/transaction';
import { db } from '@/services/firebase';

const parseDate = (value: unknown): Date => {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'string') return new Date(value);
  return new Date();
};

const mapDataToTransaction = (id: string, data: DocumentData): Transaction => {
  return {
    id,
    description: String(data.description || ''),
    amount: Number(data.amount || 0),
    type: data.type,
    category: data.category,
    date: parseDate(data.date),
    createdAt: parseDate(data.createdAt),
    imageUri: data.imageUri,
    imageType: data.imageType,
    fileName: data.fileName,
  };
};

const mapDocToTransaction = (docSnap: QueryDocumentSnapshot<DocumentData>): Transaction =>
  mapDataToTransaction(docSnap.id, docSnap.data());

const buildBaseQuery = (userId: string, filters: TransactionFilters) => {
  let q = query(collection(db, 'transactions'), where('userId', '==', userId));

  if (filters.type) {
    q = query(q, where('type', '==', filters.type));
  }
  if (filters.category) {
    q = query(q, where('category', '==', filters.category));
  }
  if (filters.startDate) {
    q = query(q, where('date', '>=', filters.startDate));
  }
  if (filters.endDate) {
    q = query(q, where('date', '<=', filters.endDate));
  }

  return query(q, orderBy('date', 'desc'));
};

export class FirebaseTransactionsRepository implements TransactionsRepository {
  async getTransactionsPage(input: GetTransactionsPageInput): Promise<GetTransactionsPageOutput> {
    const base = buildBaseQuery(input.userId, input.filters);
    let q = query(base, limit(input.pageSize));

    if (input.cursor) {
      q = query(q, startAfter(input.cursor as QueryDocumentSnapshot<DocumentData>));
    }

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(mapDocToTransaction);
    const cursor = (snapshot.docs[snapshot.docs.length - 1] ?? null) as TransactionCursor | null;

    return { data, cursor };
  }

  async countTransactions(userId: string, filters: TransactionFilters): Promise<number> {
    const q = buildBaseQuery(userId, filters);
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  }

  async getAllTransactions(userId: string, filters: TransactionFilters): Promise<Transaction[]> {
    const q = buildBaseQuery(userId, filters);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDocToTransaction);
  }

  subscribeToTransactions(
    userId: string,
    filters: TransactionFilters,
    onChange: () => void
  ): () => void {
    const q = buildBaseQuery(userId, filters);
    const unsubscribe = onSnapshot(
      q,
      () => {
        onChange();
      },
      (error) => {
        console.error('Realtime transaction subscription error:', error);
      }
    );

    return unsubscribe;
  }

  async getTransactionById(userId: string, transactionId: string): Promise<Transaction | null> {
    const snapshot = await getDoc(doc(db, 'transactions', transactionId));
    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    if (data.userId !== userId) return null;

    return mapDataToTransaction(snapshot.id, data);
  }

  async createTransaction(input: UpsertTransactionInput): Promise<void> {
    const attachmentPayload = input.imageUri
      ? {
          imageUri: input.imageUri,
          ...(input.imageType ? { imageType: input.imageType } : {}),
          fileName: input.fileName ?? null,
        }
      : {};

    await addDoc(collection(db, 'transactions'), {
      description: input.description,
      amount: input.amount,
      type: input.type,
      category: input.category,
      date: Timestamp.fromDate(input.date),
      userId: input.userId,
      ...attachmentPayload,
      createdAt: serverTimestamp(),
    });
  }

  async updateTransaction(transactionId: string, input: UpsertTransactionInput): Promise<void> {
    const attachmentPayload = input.imageUri
      ? {
          imageUri: input.imageUri,
          ...(input.imageType ? { imageType: input.imageType } : {}),
          fileName: input.fileName ?? null,
        }
      : {
          imageUri: deleteField(),
          imageType: deleteField(),
          fileName: deleteField(),
        };

    await updateDoc(doc(db, 'transactions', transactionId), {
      description: input.description,
      amount: input.amount,
      type: input.type,
      category: input.category,
      date: Timestamp.fromDate(input.date),
      userId: input.userId,
      ...attachmentPayload,
      updatedAt: serverTimestamp(),
    });
  }
}
