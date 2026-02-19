import CryptoJS from 'crypto-js';

const ENCRYPTED_PREFIX = 'enc::';

const resolveEncryptionKey = (): string => {
  const envKey = process.env.EXPO_PUBLIC_ATTACHMENT_ENCRYPTION_KEY?.trim();
  if (envKey) return envKey;
  throw new Error(
    'Missing EXPO_PUBLIC_ATTACHMENT_ENCRYPTION_KEY. Define it before starting the app.'
  );
};

const encryptionKey = resolveEncryptionKey();

export const encryptSensitiveData = (plainText: string): string => {
  if (!plainText) return plainText;
  const cipherText = CryptoJS.AES.encrypt(plainText, encryptionKey).toString();
  return `${ENCRYPTED_PREFIX}${cipherText}`;
};

export const decryptSensitiveData = (value: string): string => {
  if (!value || !value.startsWith(ENCRYPTED_PREFIX)) return value;

  try {
    const cipherText = value.replace(ENCRYPTED_PREFIX, '');
    const bytes = CryptoJS.AES.decrypt(cipherText, encryptionKey);
    const plainText = bytes.toString(CryptoJS.enc.Utf8);
    return plainText || value;
  } catch (error) {
    console.error('Decrypt error:', error);
    return value;
  }
};
