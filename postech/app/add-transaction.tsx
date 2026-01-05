import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TransactionType, TransactionCategory } from '@/types/transaction';
import { API_ENDPOINTS } from '@/config/api';

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

export default function AddTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const transactionId = params.id as string | undefined;
  const isEditing = !!transactionId;
  
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('outros');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
  
    if (numbers === '') return '';
    const amount = parseFloat(numbers) / 100;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleAmountChange = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    
    if (numbers === '') {
      setAmount('');
      return;
    }
    
    const formatted = formatCurrency(numbers);
    setAmount(formatted);
  };

  const formatDate = (text: string): string => {
    const numbers = text.replace(/\D/g, '');
    
    if (numbers === '') return '';
    
    const limited = numbers.slice(0, 8);
    
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 4) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    } else {
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
    }
  };

  const handleDateChange = (text: string) => {
    const formatted = formatDate(text);
    setDate(formatted);
  };

  const parseDate = (dateString: string): Date | null => {
    if (!dateString || dateString.length < 10) {
      return null;
    }
    
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    
    const date = new Date(year, month, day);
    
    if (
      date.getDate() !== day ||
      date.getMonth() !== month ||
      date.getFullYear() !== year
    ) {
      return null;
    }
    
    return date;
  };

  const getAmountAsNumber = (): number => {
    const numbers = amount.replace(/\D/g, '');
    if (numbers === '') return 0;
    return parseFloat(numbers) / 100;
  };

  const getAvailableCategories = (): TransactionCategory[] => {
    if (transactionType === 'income') {
      return ['salario', 'outros'];
    }
    return ['alimentacao', 'transporte', 'saude', 'educacao', 'lazer', 'moradia', 'outros'];
  };

  useEffect(() => {
    if (transactionId && !isLoading) {
      setIsLoading(true);
      fetch(`${API_ENDPOINTS.transactions}/${transactionId}`)
        .then((res) => res.json())
        .then((data) => {
          setTransactionType(data.type);
          setTitle(data.description);
          // formata o valor como moeda
          const formattedAmount = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
          }).format(data.amount);
          setAmount(formattedAmount);
          // formata a data como DD/MM/YYYY
          const transactionDate = new Date(data.date);
          const day = String(transactionDate.getDate()).padStart(2, '0');
          const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
          const year = transactionDate.getFullYear();
          setDate(`${day}/${month}/${year}`);
          setCategory(data.category);
        })
        .catch((error) => {
          console.error('Erro ao carregar transação:', error);
          Alert.alert('Erro', 'Não foi possível carregar a transação.');
          router.back();
        })
        .finally(() => setIsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  // ajusta categoria quando o tipo muda
  useEffect(() => {
    const availableCategories = getAvailableCategories();
    if (!availableCategories.includes(category)) {
      // se a categoria atual não é válida para o novo tipo, muda para a primeira disponível
      setCategory(availableCategories[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionType]);

  const handleCategoryChange = (newCategory: TransactionCategory) => {
    setCategory(newCategory);
    setShowCategoryModal(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !amount || !date || !category) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const amountValue = getAmountAsNumber();
    if (amountValue === 0) {
      Alert.alert('Erro', 'O valor deve ser maior que zero');
      return;
    }

    const transactionDate = parseDate(date);
    if (!transactionDate) {
      Alert.alert('Erro', 'Data inválida. Use o formato DD/MM/YYYY');
      return;
    }
    if (isSaving) return;
    setIsSaving(true);

    try {
      const now = new Date();
      const transaction = {
        description: title.trim(),
        amount: amountValue,
        type: transactionType,
        category: category,
        date: transactionDate.toISOString(),
        ...(isEditing ? {} : { createdAt: now.toISOString() }),
      };

      const url = isEditing
        ? `${API_ENDPOINTS.transactions}/${transactionId}`
        : API_ENDPOINTS.transactions;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        throw new Error(`Erro ao ${isEditing ? 'atualizar' : 'salvar'}: ${response.status}`);
      }

      const dataAtual = Date.now();
      router.replace({ pathname: '/transactions', params: { refresh: String(dataAtual) } });
    } catch (error) {
      console.error(`Erro ao ${isEditing ? 'atualizar' : 'salvar'} transação:`, error);
      Alert.alert(
        'Erro',
        `Não foi possível ${isEditing ? 'atualizar' : 'salvar'} a transação. Verifique se o servidor está rodando.`
      );
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.logoText}>
          <Text style={{ color: '#fff' }}>{isEditing ? 'Editar Transação' : 'Nova Transação'}</Text>
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>
            Preencha os dados da transação
          </Text>

          <View style={styles.inputContainer}>
            {/* tipo */}
            <Text style={styles.label}>Tipo de Transação</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  transactionType === 'income' && styles.typeOptionActive,
                ]}
                onPress={() => setTransactionType('income')}>
                <Ionicons
                  name="arrow-down-circle"
                  size={24}
                  color={transactionType === 'income' ? '#fff' : '#6DBF58'}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    transactionType === 'income' && styles.typeOptionTextActive,
                  ]}>
                  Receita
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  transactionType === 'expense' && styles.typeOptionActive,
                ]}
                onPress={() => setTransactionType('expense')}>
                <Ionicons
                  name="arrow-up-circle"
                  size={24}
                  color={transactionType === 'expense' ? '#fff' : '#EF6C4D'}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    transactionType === 'expense' && styles.typeOptionTextActive,
                  ]}>
                  Despesa
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Título</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o título da transação"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />

            {/* input data */}
            <Text style={styles.label}>Data</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              value={date}
              onChangeText={handleDateChange}
              keyboardType="numeric"
              maxLength={10}
            />

            {/* categoria */}
            <Text style={styles.label}>Categoria</Text>
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setShowCategoryModal(true)}>
              <View style={styles.categorySelectorContent}>
                <Ionicons
                  name={CATEGORY_ICONS[category] as any}
                  size={20}
                  color={THEME_COLOR}
                />
                <Text style={styles.categorySelectorText}>
                  {CATEGORY_LABELS[category]}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            {/* valor */}
            <Text style={styles.label}>Valor</Text>
            <TextInput
              style={styles.input}
              placeholder="R$ 0,00"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              maxLength={20}
            />
          </View>

          {/* btn salvar */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={THEME_COLOR} />
              <Text style={styles.loadingText}>Carregando transação...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.button,
                (isSaving || !title.trim() || !amount || !date || !category || parseFloat(amount.replace(/\D/g, '')) === 0) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={isSaving || !title.trim() || !amount || !date || !category || parseFloat(amount.replace(/\D/g, '')) === 0}>
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isEditing ? 'Atualizar Transação' : 'Salvar Transação'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* modal categoria */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Categoria</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {getAvailableCategories().map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryOption,
                    category === cat && styles.categoryOptionActive,
                  ]}
                  onPress={() => handleCategoryChange(cat)}>
                  <View style={styles.categoryOptionContent}>
                    <Ionicons
                      name={CATEGORY_ICONS[cat] as any}
                      size={24}
                      color={category === cat ? '#fff' : THEME_COLOR}
                    />
                    <Text
                      style={[
                        styles.categoryOptionText,
                        category === cat && styles.categoryOptionTextActive,
                      ]}>
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </View>
                  {category === cat && (
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 30,
    textAlign: 'left',
  },
  inputContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  typeOptionActive: {
    borderColor: THEME_COLOR,
    backgroundColor: THEME_COLOR,
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  typeOptionTextActive: {
    color: '#fff',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 5,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  categorySelector: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  categorySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categorySelectorText: {
    fontSize: 16,
    color: '#333',
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
    maxHeight: '70%',
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
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  categoryOptionActive: {
    borderColor: THEME_COLOR,
    backgroundColor: THEME_COLOR,
  },
  categoryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryOptionTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: THEME_COLOR,
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: '#FFBCA8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginTop: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});
