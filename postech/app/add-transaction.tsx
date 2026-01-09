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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { TransactionType, TransactionCategory } from '@/types/transaction';
import { auth, db } from '@/services/firebase';
import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

const THEME_COLOR = '#EF6C4D';
const HEADER_BG = '#000';

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  alimentacao: 'Alimentacao',
  transporte: 'Transporte',
  saude: 'Saude',
  educacao: 'Educacao',
  lazer: 'Lazer',
  moradia: 'Moradia',
  salario: 'Salario',
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
  const insets = useSafeAreaInsets();
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageType, setImageType] = useState<'image' | 'pdf' | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showFilePickerModal, setShowFilePickerModal] = useState(false);

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

  // Funcao para converter URI para base64
  const uriToBase64 = async (uri: string): Promise<string> => {
    try {
      if (uri.startsWith('data:')) {
        return uri;
      }

      const response = await fetch(uri);
      const blob = await response.blob();
      
      if (typeof FileReader !== 'undefined') {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }

      const base64 = btoa(binary);
      const mimeType = uri.endsWith('.pdf') || uri.includes('pdf')
        ? 'application/pdf'
        : 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Erro ao converter URI para base64:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (transactionId && !isLoading) {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Erro', 'Usuario nao autenticado.');
        router.push('/login');
        return;
      }

      setIsLoading(true);
      getDoc(doc(db, 'transactions', transactionId))
        .then((snapshot) => {
          if (!snapshot.exists()) {
            throw new Error('Transacao nao encontrada.');
          }
          const data = snapshot.data();
          if (data.userId !== userId) {
            throw new Error('Acesso negado.');
          }

          setTransactionType(data.type);
          setTitle(data.description);
          const formattedAmount = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
          }).format(data.amount);
          setAmount(formattedAmount);
          const rawDate = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
          const day = String(rawDate.getDate()).padStart(2, '0');
          const month = String(rawDate.getMonth() + 1).padStart(2, '0');
          const year = rawDate.getFullYear();
          setDate(`${day}/${month}/${year}`);
          setCategory(data.category);
          if (data.imageUri) {
            setSelectedImage(data.imageUri);
            setImageType(data.imageType || 'image');
            setFileName(data.fileName || 'arquivo_anexado');
          }
        })
        .catch((error) => {
          console.error('Erro ao carregar transacao:', error);
          Alert.alert('Erro', 'Nao foi possivel carregar a transacao.');
          router.push('/transactions');
        })
        .finally(() => setIsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  useEffect(() => {
    const availableCategories = getAvailableCategories();
    if (!availableCategories.includes(category)) {
      setCategory(availableCategories[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionType]);

  const handleCategoryChange = (newCategory: TransactionCategory) => {
    setCategory(newCategory);
    setShowCategoryModal(false);
  };

  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissao necessaria', 'Precisamos de permissao para acessar suas imagens.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        try {
          const base64 = await uriToBase64(asset.uri);
          setSelectedImage(base64);
          setImageType('image');
          setFileName(asset.fileName || asset.uri.split('/').pop() || 'imagem.jpg');
        } catch (error) {
          console.error('Erro ao converter imagem:', error);
          Alert.alert('Erro', 'Nao foi possivel processar a imagem. Tente novamente.');
        }
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Nao foi possivel selecionar a imagem. Tente novamente.');
    }
  };

  const handleSelectPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        try {
          const base64 = await uriToBase64(asset.uri);
          setSelectedImage(base64);
          setImageType('pdf');
          setFileName(asset.name || 'documento.pdf');
        } catch (error) {
          console.error('Erro ao converter PDF:', error);
          Alert.alert('Erro', 'Nao foi possivel processar o arquivo PDF. Tente novamente.');
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('cancel') || errorMessage.includes('Cancel')) {
        return;
      }
      console.error('Erro ao selecionar PDF:', error);
      Alert.alert('Erro', 'Nao foi possivel selecionar o arquivo PDF. Tente novamente.');
    }
  };

  const handleSelectFile = () => {
    console.log('handleSelectFile chamado');
    setShowFilePickerModal(true);
  };

  const handleSelectImageOption = async () => {
    setShowFilePickerModal(false);
    await handleSelectImage();
  };

  const handleSelectPDFOption = async () => {
    setShowFilePickerModal(false);
    await handleSelectPDF();
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageType(null);
    setFileName(null);
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
      Alert.alert('Erro', 'Data invalida. Use o formato DD/MM/YYYY');
      return;
    }
    if (isSaving) return;

    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Erro', 'Usuario nao autenticado.');
      return;
    }

    setIsSaving(true);

    try {
      const transaction = {
        description: title.trim(),
        amount: amountValue,
        type: transactionType,
        category: category,
        date: Timestamp.fromDate(transactionDate),
        userId,
        ...(selectedImage
          ? {
              imageUri: selectedImage,
              imageType: imageType,
              fileName: fileName || null,
            }
          : {}),
      };

      if (isEditing && transactionId) {
        await updateDoc(doc(db, 'transactions', transactionId), {
          ...transaction,
          ...(selectedImage
            ? {}
            : {
                imageUri: deleteField(),
                imageType: deleteField(),
                fileName: deleteField(),
              }),
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'transactions'), {
          ...transaction,
          createdAt: serverTimestamp(),
        });
      }

      const dataAtual = Date.now();
      router.replace({ pathname: '/transactions', params: { refresh: String(dataAtual) } });
    } catch (error) {
      console.error(`Erro ao ${isEditing ? 'atualizar' : 'salvar'} transacao:`, error);
      Alert.alert(
        'Erro',
        `Nao foi possivel ${isEditing ? 'atualizar' : 'salvar'} a transacao.`
      );
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={() => router.push('/transactions')}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.logoText}>
          <Text style={{ color: '#fff' }}>{isEditing ? 'Editar Transacao' : 'Nova Transacao'}</Text>
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>
            Preencha os dados da transacao
          </Text>

          <View style={styles.inputContainer}>
            {/* tipo */}
            <Text style={styles.label}>Tipo de Transacao</Text>
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

            <Text style={styles.label}>Titulo</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o titulo da transacao"
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

            {/* anexo */}
            <Text style={styles.label}>Anexo (Opcional)</Text>
            {selectedImage ? (
              <View style={styles.imageContainer}>
                {imageType === 'image' ? (
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />
                ) : (
                  <View style={styles.pdfPreview}>
                    <Ionicons name="document" size={48} color={THEME_COLOR} />
                    <Text style={styles.pdfFileName} numberOfLines={1}>
                      {fileName}
                    </Text>
                  </View>
                )}
                <View style={styles.imageActions}>
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={handleRemoveImage}>
                    <Ionicons name="trash-outline" size={20} color="#EF6C4D" />
                    <Text style={styles.removeImageText}>Remover</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={handleSelectFile}>
                    <Ionicons name="create-outline" size={20} color={THEME_COLOR} />
                    <Text style={styles.changeImageText}>Alterar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectFileButton}
                onPress={handleSelectFile}
                activeOpacity={0.7}
                accessibilityLabel="Selecionar arquivo">
                <Ionicons name="attach-outline" size={24} color={THEME_COLOR} />
                <Text style={styles.selectFileText}>
                  Selecionar arquivo (JPG, JPEG ou PDF)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* btn salvar */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={THEME_COLOR} />
              <Text style={styles.loadingText}>Carregando transacao...</Text>
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
                  {isEditing ? 'Atualizar Transacao' : 'Salvar Transacao'}
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

      {/* Modal de Seleccao de Arquivo */}
      <Modal
        visible={showFilePickerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilePickerModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.filePickerModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Arquivo</Text>
              <TouchableOpacity onPress={() => setShowFilePickerModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.filePickerOptions}>
              <TouchableOpacity
                style={styles.filePickerOption}
                onPress={handleSelectImageOption}
                activeOpacity={0.7}>
                <View style={styles.filePickerOptionContent}>
                  <Ionicons name="image-outline" size={32} color={THEME_COLOR} />
                  <Text style={styles.filePickerOptionText}>Imagem (JPG/JPEG)</Text>
                  <Text style={styles.filePickerOptionSubtext}>Selecionar da galeria</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filePickerOption}
                onPress={handleSelectPDFOption}
                activeOpacity={0.7}>
                <View style={styles.filePickerOptionContent}>
                  <Ionicons name="document-outline" size={32} color={THEME_COLOR} />
                  <Text style={styles.filePickerOptionText}>PDF</Text>
                  <Text style={styles.filePickerOptionSubtext}>Selecionar documento</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.filePickerCancelButton}
              onPress={() => setShowFilePickerModal(false)}
              activeOpacity={0.7}>
              <Text style={styles.filePickerCancelText}>Cancelar</Text>
            </TouchableOpacity>
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
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }),
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
  selectFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderWidth: 2,
    borderColor: THEME_COLOR,
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#FFF5F3',
    gap: 8,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  selectFileText: {
    fontSize: 16,
    color: THEME_COLOR,
    fontWeight: '600',
  },
  imageContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  pdfPreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pdfFileName: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    maxWidth: '90%',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF6C4D',
    backgroundColor: '#fff',
  },
  removeImageText: {
    fontSize: 14,
    color: '#EF6C4D',
    fontWeight: '600',
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: THEME_COLOR,
  },
  changeImageText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  filePickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 20,
  },
  filePickerOptions: {
    padding: 20,
    gap: 12,
  },
  filePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  filePickerOptionContent: {
    flex: 1,
    gap: 4,
  },
  filePickerOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  filePickerOptionSubtext: {
    fontSize: 12,
    color: '#666',
  },
  filePickerCancelButton: {
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  filePickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
