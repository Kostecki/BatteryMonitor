import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'

const config = {
  apiKey: 'AIzaSyDONenKsaCwdLuC_L9WJXxGIwD0oziZFGY',
  authDomain: 'batterymonitor-2b1c4.firebaseapp.com',
  databaseURL: 'https://batterymonitor-2b1c4.firebaseio.com',
  projectId: 'batterymonitor-2b1c4'
}

console.log(config, process, process.env)

if (!firebase.apps.length) {
  firebase.initializeApp(config)
}

export const refBatteries = firebase.database().ref('batteries')
export const refMeasurements = firebase.database().ref('measurements')
export default firebase
