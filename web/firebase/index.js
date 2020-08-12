import { firebase } from '@firebase/app'
import 'firebase/firestore'
import 'firebase/auth'

const config = {
  apiKey: process.env.FIREBASE_API_KEY.toString(),
  authDomain: process.env.FIREBASE_AUTH_DOMAIN.toString(),
  databaseURL: process.env.FIREBASE_DB_URL.toString(),
  projectId: process.env.FIREBASE_PROJECT_ID.toString()
}

console.log('this is index.js')
console.log(process.env.FIREBASE_API_KEY.toString())
console.log(process.env.FIREBASE_AUTH_DOMAIN.toString())
console.log(process.env.FIREBASE_DB_URL.toString())
console.log(process.env.FIREBASE_PROJECT_ID.toString())

export const db = !firebase.apps.length
  ? firebase.initializeApp(config).firestore()
  : firebase.app().firestore()

// Export utility functions
export const { Timestamp } = firebase.firestore
