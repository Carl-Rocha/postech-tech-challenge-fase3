import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '@/hooks/useTransactions';
import { Transaction, TransactionCategory, TransactionType } from '@/types/transaction';

const THEME_COLOR = '#EF6C4D';
const HEADER_BG = '#000';

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  saude: 'Saúde',
  educacao: 'Educação',
  lazer: 'Lazer',
  moradia: 'Moradia',
  salario: 'Salário',
  outros: 'Outros',
};

const CATEGORY_ICONS: Record<TransactionCategory, string> = {
  alimentacao: 'restaurant',
  transporte: 'car',
  saude: 'medical',
  educacao: 'school',
  lazer: 'happy',
  moradia: 'home',
  salario: 'cash',
  outros: 'ellipse',
};

export default function TransactionsScreen() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | undefined>();
  const [selectedType, setSelectedType] = useState<TransactionType | undefined>();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const {
    transactions,
    summary,
    updateFilters,
    loadMore,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    error,
  } = useTransactions();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const formatDateShort = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    return formatDate(date);
  };

  const applyFilters = () => {
    updateFilters({
      search: searchText || undefined,
      category: selectedCategory,
      type: selectedType,
      startDate,
      endDate,
    });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedCategory(undefined);
    setSelectedType(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    updateFilters({});
    setShowFilters(false);
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'income';
    const iconName = CATEGORY_ICONS[item.category];

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionIconContainer}>
          <View style={[styles.transactionIcon, isIncome ? styles.incomeIcon : styles.expenseIcon]}>
            <Ionicons
              name={iconName as any}
              size={20}
              color={isIncome ? '#6DBF58' : '#EF6C4D'}
            />
          </View>
        </View>
        <View style={styles.transactionContent}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionCategory}>{CATEGORY_LABELS[item.category]}</Text>
          <Text style={styles.transactionDate}>{formatDateShort(item.date)}</Text>
        </View>
        <View style={styles.transactionAmount}>
          <Text
            style={[
              styles.transactionAmountText,
              isIncome ? styles.incomeAmount : styles.expenseAmount,
            ]}>
            {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
          </Text>
        </View>
      </View>
    );
  };

  const handleClearSearch = useCallback(() => {
    setSearchText('');
    updateFilters({
      search: undefined,
      category: selectedCategory,
      type: selectedType,
      startDate,
      endDate,
    });
  }, [selectedCategory, selectedType, startDate, endDate, updateFilters]);

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={THEME_COLOR} />
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>Nenhuma transação encontrada</Text>
      <Text style={styles.emptyStateSubtext}>
        Tente ajustar os filtros ou adicione uma nova transação
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.logoText}>
          <Text style={{ color: '#fff' }}>Byte</Text>
          <Text style={{ color: THEME_COLOR }}>bank</Text>
        </Text>
        <TouchableOpacity onPress={() => router.push('/add-transaction')}>
          <Ionicons name="add-circle" size={28} color={THEME_COLOR} />
        </TouchableOpacity>
      </View>

      {/* Card de Saldo - Fora da FlatList */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Saldo Total</Text>
          <TouchableOpacity onPress={() => setShowFilters(true)}>
            <Ionicons name="filter" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.balanceAmount}>{formatCurrency(summary.totalBalance)}</Text>
        <View style={styles.balanceDetails}>
          <View style={styles.balanceDetailItem}>
            <Ionicons name="arrow-down-circle" size={16} color="#6DBF58" />
            <Text style={styles.balanceDetailText}>
              {formatCurrency(summary.totalIncome)}
            </Text>
          </View>
          <View style={styles.balanceDetailItem}>
            <Ionicons name="arrow-up-circle" size={16} color="#EF6C4D" />
            <Text style={styles.balanceDetailText}>
              {formatCurrency(summary.totalExpense)}
            </Text>
          </View>
        </View>
      </View>

      {/* Barra de Busca - Fora da FlatList */}
      <View style={styles.searchInputContainer}>
        <Text style={styles.searchLabel}>Buscar</Text>
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Digite para buscar transações..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={applyFilters}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Título do Extrato */}
      <View style={styles.extractHeader}>
        <Text style={styles.extractTitle}>Extrato</Text>
        <Text style={styles.extractCount}>
          {totalCount} {totalCount === 1 ? 'transação' : 'transações'}
        </Text>
      </View>

      {/* Mensagem de Erro */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#EF6C4D" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* lista transacao */}
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (hasMore && !isLoadingMore && !isLoading) {
            loadMore();
          }
        }}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
      />

      {/* add transacao */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-transaction')}
        activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* filtro */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* tipo */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Tipo</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      selectedType === 'income' && styles.filterOptionActive,
                    ]}
                    onPress={() =>
                      setSelectedType(selectedType === 'income' ? undefined : 'income')
                    }>
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedType === 'income' && styles.filterOptionTextActive,
                      ]}>
                      Receitas
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      selectedType === 'expense' && styles.filterOptionActive,
                    ]}
                    onPress={() =>
                      setSelectedType(selectedType === 'expense' ? undefined : 'expense')
                    }>
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedType === 'expense' && styles.filterOptionTextActive,
                      ]}>
                      Despesas
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* categoria */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Categoria</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryContainer}>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.categoryChip,
                          selectedCategory === key && styles.categoryChipActive,
                        ]}
                        onPress={() =>
                          setSelectedCategory(
                            selectedCategory === key ? undefined : (key as TransactionCategory)
                          )
                        }>
                        <Ionicons
                          name={CATEGORY_ICONS[key as TransactionCategory] as any}
                          size={16}
                          color={selectedCategory === key ? '#fff' : THEME_COLOR}
                        />
                        <Text
                          style={[
                            styles.categoryChipText,
                            selectedCategory === key && styles.categoryChipTextActive,
                          ]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalButtonSecondary} onPress={clearFilters}>
                <Text style={styles.modalButtonSecondaryText}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={applyFilters}>
                <Text style={styles.modalButtonPrimaryText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: HEADER_BG,
  },
  header: {
    backgroundColor: HEADER_BG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 100,
  },
  balanceCard: {
    backgroundColor: THEME_COLOR,
    margin: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  balanceDetails: {
    flexDirection: 'row',
    gap: 20,
  },
  balanceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceDetailText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchInputContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  searchLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  clearButton: {
    position: 'absolute',
    right: 15,
    padding: 4,
  },
  extractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  extractTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  extractCount: {
    fontSize: 14,
    color: '#666',
  },
  transactionItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  transactionIconContainer: {
    marginRight: 15,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeIcon: {
    backgroundColor: '#E8F5E9',
  },
  expenseIcon: {
    backgroundColor: '#FFEBEE',
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeAmount: {
    color: '#6DBF58',
  },
  expenseAmount: {
    color: '#EF6C4D',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 8,
    gap: 10,
  },
  errorText: {
    flex: 1,
    color: '#EF6C4D',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 25,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  filterOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  filterOptionActive: {
    borderColor: THEME_COLOR,
    backgroundColor: '#FFF5F3',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterOptionTextActive: {
    color: THEME_COLOR,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME_COLOR,
    backgroundColor: '#fff',
  },
  categoryChipActive: {
    backgroundColor: THEME_COLOR,
  },
  categoryChipText: {
    fontSize: 12,
    color: THEME_COLOR,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 10,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: THEME_COLOR,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

