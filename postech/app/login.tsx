import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router'; 
import { useFormik } from 'formik'; 
import * as Yup from 'yup'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

const getAuthErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code?: string }).code);
    if (code === 'auth/invalid-email') return 'Email invalido.';
    if (code === 'auth/user-not-found') return 'Usuario nao encontrado.';
    if (code === 'auth/wrong-password') return 'Senha incorreta.';
    if (code === 'auth/invalid-credential') return 'Credenciais invalidas.';
    if (code === 'auth/too-many-requests') return 'Muitas tentativas. Tente novamente depois.';
  }

  return 'Nao foi possivel entrar. Tente novamente.';
};

export default function LoginScreen() {
  const router = useRouter();

  // 1. Configuração das Regras de Validação
  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email('Digite um email válido')
      .required('Email é obrigatório'),
      
    password: Yup.string()
      .required('Senha é obrigatória'),
  });

  // 2. Configuração do Formik
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const email = values.email.trim();
        await signInWithEmailAndPassword(auth, email, values.password);
        Alert.alert('Login', 'Login realizado com sucesso!');
        router.replace('/');
      } catch (error) {
        Alert.alert('Erro no login', getAuthErrorMessage(error));
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.illustrationContainer}>
            <Image 
              source={require('../assets/images/illustration-login.png')} 
              style={styles.illustration} 
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>
            Login
          </Text>

          <View style={styles.inputContainer}>
            
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[
                styles.input, 
                formik.touched.email && formik.errors.email ? styles.inputError : null
              ]}
              placeholder="Digite seu email"
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={formik.handleChange('email')}
              onBlur={formik.handleBlur('email')}
              value={formik.values.email}
            />
            {formik.touched.email && formik.errors.email && (
              <Text style={styles.errorText}>{formik.errors.email}</Text>
            )}

            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={[
                styles.input, 
                formik.touched.password && formik.errors.password ? styles.inputError : null
              ]}
              placeholder="Digite sua senha"
              secureTextEntry
              onChangeText={formik.handleChange('password')}
              onBlur={formik.handleBlur('password')}
              value={formik.values.password}
            />
            {formik.touched.password && formik.errors.password && (
              <Text style={styles.errorText}>{formik.errors.password}</Text>
            )}
          </View>

          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity onPress={() => console.log("Recuperar senha")}>
                <Text style={styles.forgotPasswordText}>Esqueci a senha!</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.button, (!formik.isValid || formik.isSubmitting) && styles.buttonDisabled]} 
            onPress={() => formik.handleSubmit()}
            disabled={formik.isSubmitting}
          >
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
             <Text style={styles.footerText}>Ainda não tem conta? </Text>
             <Link href="/signup" style={styles.footerLink}>
                Criar conta
             </Link>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 24,
    flexGrow: 1,
  },
  headerRow: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 30,
    height: 200,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
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
  },
  inputError: {
    borderColor: '#FF4D4D',
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 12,
    marginBottom: 15,
    marginLeft: 2,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#6DBF58',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#EF6C4D',
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  footerText: {
    color: '#666',
  },
  footerLink: {
    color: '#EF6C4D',
    fontWeight: 'bold',
  },
});
