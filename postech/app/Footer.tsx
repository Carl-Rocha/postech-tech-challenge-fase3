import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Footer() {
  return (
    <View style={styles.container}>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Serviços</Text>
        <Text style={styles.text}>Conta corrente</Text>
        <Text style={styles.text}>Conta PJ</Text>
        <Text style={styles.text}>Cartão de crédito</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contato</Text>
        <Text style={styles.text}>0800 004 250 08</Text>
        <Text style={styles.text}>meajuda@bytebank.com.br</Text>
        <Text style={styles.text}>ouvidoria@bytebank.com.br</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Desenvolvido por Alura</Text>
      </View>

      <View style={styles.footerBottom}>
        {/* Logo Bytebank Simulado */}
        <View style={styles.logoContainer}>
            <View style={styles.logoIcon} />
            <View style={styles.logoIconSmall} />
            <Text style={styles.logoText}>Bytebank</Text>
        </View>

        <View style={styles.socialIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="logo-instagram" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="logo-whatsapp" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="logo-youtube" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    paddingVertical: 40,
    paddingHorizontal: 24,
    width: '100%',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  footerBottom: {
    marginTop: 20,
    gap: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  logoIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    marginRight: 2,
  },
  logoIconSmall: {
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 20,
  },
  iconButton: {
    padding: 5,
  },
});