import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  StatusBar,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Footer from './Footer'; 

const THEME_COLOR = '#EF6C4D'; 
const HEADER_BG = '#000';      

export default function ErrorScreen() {
  const router = useRouter();

  const handleBackToHome = () => {
    router.replace('/'); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} />

      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        bounces={false}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToHome}>
             <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.logoText}>
              <Text style={{color: '#fff'}}>Byte</Text>
              <Text style={{color: THEME_COLOR}}>bank</Text>
          </Text>
        </View>

        <View style={styles.contentWrapper}>
          
          <View style={styles.textWrapper}>
              <Text style={styles.title}>
                Ops! Nao encontramos a pagina...
              </Text>
              
              <Text style={styles.description}>
                E olha que exploramos o universo procurando por ela! 
                Que tal voltar e tentar novamente?
              </Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleBackToHome}>
            <Text style={styles.buttonText}>Voltar ao inicio</Text>
          </TouchableOpacity>

          <View style={styles.illustrationContainer}>
             <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/7486/7486754.png' }} 
                style={styles.illustration} 
                resizeMode="contain"
             />
             <Text style={styles.errorCode}>404</Text>
          </View>

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
  scrollContainer: {
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
    height: 70,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  // Wrapper para separar o conteudo do footer
  contentWrapper: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  textWrapper: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  button: {
    backgroundColor: THEME_COLOR,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
    shadowColor: THEME_COLOR, 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginBottom: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  illustrationContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 300,
  },
  illustration: {
    width: 280,
    height: 280,
    zIndex: 2,
  },
  errorCode: {
    fontSize: 100,
    fontWeight: '900',
    color: '#F0F0F0',
    position: 'absolute',
    bottom: 20,
    zIndex: 1,
  }
});

