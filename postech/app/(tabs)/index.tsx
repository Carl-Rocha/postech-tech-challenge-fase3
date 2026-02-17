import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Footer from '../Footer';
import { Image } from 'expo-image';
import { useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@/types/transaction';

const THEME_COLOR = '#EF6C4D';
const HEADER_BG = '#000';
const HERO_IMAGE_URL = 'https://cdn-icons-png.flaticon.com/512/7466/7466137.png';
const BLUR_HASH = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQ_3t7t7j[ayfRayfQfQ_3t7t7j[ayfRayfQfQ_3t7t7j[ayfRayfQfQ_3t7t7j[ayfRayfQfQ_3t7t7j[ayfRayfQfQ';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const queryClient = useQueryClient();

  const handleNavigateToTransactions = async () => {
    try {
      await queryClient.prefetchInfiniteQuery({
        queryKey: ['transactions', { search: '', category: undefined, type: undefined }],
        queryFn: async () => {
             // Chama API
             return { data: [], nextPage: 2, hasMore: false };
        },
        initialPageParam: 1,
        staleTime: 1000 * 60 * 5, // 5 minutos
      });
    } catch (err) {
      console.log('Erro no prefetch (não bloqueante):', err);
    }

    router.push('/transactions');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
            <TouchableOpacity activeOpacity={0.7}>
                <Ionicons name="menu" size={28} color="#EF6C4D" />
            </TouchableOpacity>
            <Text style={styles.logoText}>
                <Text style={{color: '#fff'}}>Byte</Text>
                <Text style={{color: THEME_COLOR}}>bank</Text>
            </Text>
            <TouchableOpacity onPress={handleNavigateToTransactions} activeOpacity={0.7}>
                <Ionicons name="wallet" size={28} color="#EF6C4D" />
            </TouchableOpacity>
        </View>

        <View style={styles.heroSection}>
           <Text style={styles.heroTitle}>Experimente mais liberdade...</Text>
           
           <Image 
             source={HERO_IMAGE_URL} 
             style={styles.heroImage} 
             contentFit="contain"
             placeholder={BLUR_HASH}
             transition={500}
             cachePolicy="memory-disk"
           />
           
           <View style={styles.heroButtonsContainer}>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/signup')} activeOpacity={0.8}>
                  <Text style={styles.btnPrimaryText}>Abrir conta</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push('/login')} activeOpacity={0.8}>
                  <Text style={styles.btnSecondaryText}>Já tenho conta</Text>
              </TouchableOpacity>
           </View>
        </View>

        <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Vantagens do nosso banco:</Text>
            <View style={styles.featureItem}>
                <Ionicons name="gift-outline" size={40} color={THEME_COLOR} style={styles.featureIcon} />
                <Text style={styles.featureName}>Conta e cartão gratuitos</Text>
                <Text style={styles.featureDesc}>Isso mesmo, nossa conta é digital...</Text>
            </View>
            <View style={styles.featureItem}>
                <Ionicons name="cash-outline" size={40} color={THEME_COLOR} style={styles.featureIcon} />
                <Text style={styles.featureName}>Saques sem custo</Text>
                <Text style={styles.featureDesc}>Você pode sacar gratuitamente 4x...</Text>
            </View>
            <View style={styles.featureItem}>
                <Ionicons name="star-outline" size={40} color={THEME_COLOR} style={styles.featureIcon} />
                <Text style={styles.featureName}>Programa de pontos</Text>
                <Text style={styles.featureDesc}>Você pode acumular pontos...</Text>
            </View>
            <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark-outline" size={40} color={THEME_COLOR} style={styles.featureIcon} />
                <Text style={styles.featureName}>Seguro Dispositivos</Text>
                <Text style={styles.featureDesc}>Seus dispositivos móveis protegidos.</Text>
            </View>
        </View>

        <View style={styles.quickAccessSection}>
            <TouchableOpacity 
                style={styles.quickAccessButton}
                onPress={handleNavigateToTransactions}
                activeOpacity={0.8}
            >
                <Ionicons name="list" size={24} color="#fff" />
                <Text style={styles.quickAccessText}>Ver Transações</Text>
            </TouchableOpacity>
        </View>

        <Footer />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: HEADER_BG,
    },
    scrollContent: {
        flexGrow: 1,
        backgroundColor: '#fff',
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
    heroSection: {
        backgroundColor: THEME_COLOR, 
        padding: 24,
        alignItems: 'center',
    },
    heroTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 28,
    },
    heroImage: {
        width: '100%',
        height: 200,
        marginBottom: 30,
    },
    heroButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 15,
    },
    btnPrimary: {
        flex: 1,
        backgroundColor: '#000', 
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnPrimaryText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    btnSecondary: {
        flex: 1,
        borderWidth: 2,
        borderColor: '#fff', 
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnSecondaryText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    featuresSection: {
        backgroundColor: '#fff',
        padding: 24,
        alignItems: 'center',
    },
    featuresTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 30,
    },
    featureItem: {
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    featureIcon: {
        marginBottom: 10,
    },
    featureName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME_COLOR,
        marginBottom: 8,
        textAlign: 'center',
    },
    featureDesc: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    quickAccessSection: {
        backgroundColor: '#fff',
        padding: 24,
        alignItems: 'center',
    },
    quickAccessButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: THEME_COLOR,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        gap: 12,
        width: '100%',
        maxWidth: 300,
    },
    quickAccessText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});