const admin = require('firebase-admin')

const serviceAccount = require('../secrets/serviceAccountKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://batterymonitor-2b1c4.firebaseio.com'
})

const firebase = admin.firestore()

module.exports = firebase
