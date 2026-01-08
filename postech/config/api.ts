import { Platform } from 'react-native';

const getBaseURL = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3001'; // android
    }
    return 'http://localhost:3001'; // ios e web
  }
  return 'http://localhost:3001';
};

export const API_BASE_URL = getBaseURL();
export const API_ENDPOINTS = {
  transactions: `${API_BASE_URL}/transactions`,
};

