import { firebase } from '@firebase/app'
import 'firebase/firestore'
import 'firebase/auth'

const config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DB_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_ID,
  appId: process.env.FIREBASE_APP_ID
}

export const db = !firebase.apps.length
  ? firebase.initializeApp(config).firestore()
  : firebase.app().firestore()

// Export utility functions
export const { Timestamp } = firebase.firestore
