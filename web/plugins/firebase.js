import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'

const config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DB_URL,
  projectId: 'batterymonitor-2b1c4'
}

console.log(config, process, process.env)

if (!firebase.apps.length) {
  firebase.initializeApp(config)
}

export const refBatteries = firebase.database().ref('batteries')
export const refMeasurements = firebase.database().ref('measurements')
export default firebase
