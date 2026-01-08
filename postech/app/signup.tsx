import React from "react";
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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // Para navegação
import { useFormik } from "formik"; // Para gerenciar o formulário
import * as Yup from "yup";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

const getAuthErrorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code?: string }).code);
    if (code === "auth/email-already-in-use") return "Email ja cadastrado.";
    if (code === "auth/invalid-email") return "Email invalido.";
    if (code === "auth/weak-password")
      return "Senha fraca. Use pelo menos 6 caracteres.";
  }

  return "Nao foi possivel criar a conta. Tente novamente.";
};

export default function SignupScreen() {
  const router = useRouter();

  // 1. Configuração das Regras de Validação
  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .min(3, "O nome deve ter pelo menos 3 letras")
      .required("Nome é obrigatório"),

    email: Yup.string()
      .email("Dado incorreto. Revise e digite novamente")
      .required("Email é obrigatório"),

    password: Yup.string()
      .min(6, "A senha deve ter no mínimo 6 caracteres")
      .required("Senha é obrigatória"),

    agreeTerms: Yup.boolean().oneOf(
      [true],
      "Você precisa aceitar os termos para continuar"
    ),
  });

  // 2. Configuração do Formik
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      agreeTerms: false,
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const email = values.email.trim();
        const name = values.name.trim();
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          values.password
        );
        await updateProfile(credential.user, { displayName: name });
        await setDoc(doc(db, "users", credential.user.uid), {
          name,
          email,
          createdAt: serverTimestamp(),
        });
        Alert.alert("Sucesso", "Conta criada!");
        router.replace("/");
      } catch (error) {
        Alert.alert("Erro", getAuthErrorMessage(error));
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
              source={require("../assets/images/illustration-signinup.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>
            Preencha os campos abaixo para criar sua conta corrente!
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={[
                styles.input,
                formik.touched.name && formik.errors.name
                  ? styles.inputError
                  : null,
              ]}
              placeholder="Digite seu nome completo"
              onChangeText={formik.handleChange("name")}
              onBlur={formik.handleBlur("name")}
              value={formik.values.name}
            />
            {formik.touched.name && formik.errors.name && (
              <Text style={styles.errorText}>{formik.errors.name}</Text>
            )}

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[
                styles.input,
                formik.touched.email && formik.errors.email
                  ? styles.inputError
                  : null,
              ]}
              placeholder="Digite seu email"
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={formik.handleChange("email")}
              onBlur={formik.handleBlur("email")}
              value={formik.values.email}
            />
            {formik.touched.email && formik.errors.email && (
              <Text style={styles.errorText}>{formik.errors.email}</Text>
            )}

            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={[
                styles.input,
                formik.touched.password && formik.errors.password
                  ? styles.inputError
                  : null,
              ]}
              placeholder="Digite sua senha"
              secureTextEntry
              onChangeText={formik.handleChange("password")}
              onBlur={formik.handleBlur("password")}
              value={formik.values.password}
            />
            {formik.touched.password && formik.errors.password && (
              <Text style={styles.errorText}>{formik.errors.password}</Text>
            )}
          </View>

          <View style={styles.checkboxWrapper}>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  formik.values.agreeTerms && styles.checkboxChecked,
                  formik.touched.agreeTerms && formik.errors.agreeTerms
                    ? styles.checkboxError
                    : null,
                ]}
                onPress={() =>
                  formik.setFieldValue("agreeTerms", !formik.values.agreeTerms)
                }
              >
                {formik.values.agreeTerms && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </TouchableOpacity>

              <Text style={styles.termsText}>
                Li e estou ciente quanto às condições de tratamento dos meus
                dados conforme descrito na Política de Privacidade do banco.
              </Text>
            </View>

            {formik.touched.agreeTerms && formik.errors.agreeTerms && (
              <Text style={styles.errorText}>{formik.errors.agreeTerms}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              (!formik.isValid || formik.isSubmitting) && styles.buttonDisabled,
            ]}
            onPress={() => formik.handleSubmit()}
            disabled={formik.isSubmitting}
          >
            <Text style={styles.buttonText}>Criar conta</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    padding: 24,
    flexGrow: 1,
  },
  headerRow: {
    alignItems: "flex-end",
    marginBottom: 10,
  },
  illustrationContainer: {
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
    height: 150,
  },
  illustration: {
    width: "100%",
    height: "100%",
  },
  lockIconBadge: {
    position: "absolute",
    top: 10,
    right: 80,
    backgroundColor: "#6DBF58",
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 30,
    textAlign: "left",
  },
  inputContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 5,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#FF4D4D",
  },
  errorText: {
    color: "#FF4D4D",
    fontSize: 12,
    marginBottom: 15,
    marginLeft: 2,
  },
  checkboxWrapper: {
    marginBottom: 30,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#6DBF58",
    borderRadius: 4,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#6DBF58",
  },
  checkboxError: {
    borderColor: "#FF4D4D",
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#EF6C4D",
    height: 55,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: "#FFBCA8",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
