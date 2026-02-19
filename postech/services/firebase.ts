import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import * as FirebaseAuth from 'firebase/auth';

type FirebaseExtraConfig = {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
};

const extra = Constants.expoConfig?.extra ?? (Constants.manifest as { extra?: unknown } | undefined)?.extra;
const firebaseConfig = (extra as { firebase?: FirebaseExtraConfig } | undefined)?.firebase;

if (!firebaseConfig) {
  throw new Error('Missing Firebase config. Add it to app.json (extra.firebase).');
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const { initializeAuth, getAuth } = FirebaseAuth;
const getReactNativePersistence = (FirebaseAuth as any).getReactNativePersistence as
  | ((storage: typeof AsyncStorage) => unknown)
  | undefined;

const auth = getApps().length
  ? getAuth(app)
  : getReactNativePersistence
    ? initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage) as any,
      })
    : getAuth(app);

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
