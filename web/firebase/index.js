import { firebase } from '@firebase/app'
import 'firebase/firestore'
import 'firebase/auth'

const config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DB_URL,
  projectId: 'batterymonitor-2b1c4'
}

console.log('this is index.js')
console.log(projectId)

export const db = !firebase.apps.length
  ? firebase.initializeApp(config).firestore()
  : firebase.app().firestore()

// Export utility functions
export const { Timestamp } = firebase.firestore
