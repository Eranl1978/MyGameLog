import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAP0kY9Lv4lMIe21X_5cmSD37uoFopsPSI',
  authDomain: 'erangamezone.firebaseapp.com',
  projectId: 'erangamezone',
  storageBucket: 'erangamezone.firebasestorage.app',
  messagingSenderId: '865338255165',
  appId: '1:865338255165:web:3e6447cd55f63fb93f8754',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)
export const googleProvider = new GoogleAuthProvider()
export const gamesCollection = 'games'
