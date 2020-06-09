import { Router } from 'express'
import axios from 'axios'
const admin = require('firebase-admin');
const router = Router()

import { calcBatteryCharge } from '../../../utils/helperFunctions'

const serviceAccount = require('../../../serviceAccountKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://batterymonitor-2b1c4.firebaseio.com"
});

const db = admin.firestore()
const docRefBatteries = db.collection('batteries')
const docRefMeasurements = db.collection('measurements')

// GET single battery by id
router.get('/battery/:id', (req, res, next) => {
  const id = req.params.id

  docRefBatteries.doc(id).get()
    .then(doc => res.status(200).json(doc.data()))
    .catch(err => res.status(500).send(`Error getting batteries: ${err}`))
})

// GET all batteries
router.get('/batteries', (req, res, next) => {
  docRefBatteries.get()
    .then(snapshot => res.status(200).json(snapshot.docs.map(doc => doc.data())))
    .catch(err => res.status(500).send(`Error getting batteries: ${err}`))
})

// POST to create battery
router.post('/battery', (req, res, next) => {
  const {
    name,
    manufacturer,
    model,
    capacity,
    latestVoltage,
    notificationsSent
  } = req.body

  const timestamp = admin.firestore.FieldValue.serverTimestamp()

  docRefBatteries.add({
    name,
    manufacturer,
    model,
    capacity,
    latestVoltage,
    notificationsSent,
    createdAt: timestamp,
    updatedAt: timestamp
  })
  .then(ref => {
    docRefBatteries.doc(ref.id).get()
      .then(snapshot => res.status(200).json(snapshot.data()))
      .catch(err => res.status(500).send(`Error getting newly created battery: ${err}`))
  })
  .catch(err => res.status(500).send(`Error craeting new battery: ${err}`))
})

// POST to create measurement
router.post('/measurement', (req, res, next) => {
  const { batteryId, voltage } = req.body

  docRefMeasurements.add({
    batteryId,
    voltage,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })
  .then(ref => {
    docRefMeasurements.doc(ref.id).get()
      .then(snapshot => {
        console.log(batteryId, voltage)
        setLatestVoltage(batteryId, voltage)
        sendNotification(batteryId, voltage)
        res.status(200).json(snapshot.data())
      })
      .catch(err => res.status(500).send(`Error getting newly created measurement: ${err}`))
  })
  .catch(err => res.status(500).send(`Error creating new measurement: ${err}`))
})

// Slack slash-command response with status for all batteries
router.post('/batteriesSlack', (req, res, next) => {
  const payload = {
    blocks: [
      {
        type: "section",
        fields: []
      }
    ]
  }

  const batteryList = []

  docRefBatteries.get()
    .then(snapshot => {
      snapshot.forEach(battery => batteryList.push(battery.data()))
      batteryList.sort((a, b) => a.latestVoltage - b.latestVoltage).reverse() // Sort by Latest Voltage (largest first)

      console.log(batteryList)

      batteryList.forEach(battery => {
        payload.blocks[0].fields.push({
          type: 'mrkdwn',
          text: `*${battery.name} (_${calcBatteryCharge(battery.latestVoltage)}%, ${battery.latestVoltage} Volt_)* \n _${battery.manufacturer}, ${battery.model} (${battery.capacity} Ah)_`
        })
      })
      
      res.status(200).json(payload)
    })
    .catch(err => res.status(500).send(`Error getting batteries: ${err}`))
})

/* "Triggers" */
// Update given battery with new "latestVoltage"
const setLatestVoltage = (batteryId, newVoltage) => {
  const update = { latestVoltage: newVoltage }

  docRefBatteries.doc(batteryId).update(update)
    .catch(err => console.error(err))
}

// Determine if a notification should be sent 
const sendNotification = (batteryId, newVoltage) => {
  docRefBatteries.doc(batteryId).get()
    .then(snapshot => {
      const battery = snapshot.data()
      if (newVoltage > 12.5) {
        docRefBatteries.doc(batteryId).update({
          notificationsSent: {
            first: false,
            second: false
          }
        })
        .catch(() => res.status(500).send(`Error updating notificationsSent: ${err}`))
      }

      // Battery is at about 50%, but above 20%: send first notfication
      if (!battery.notificationsSent.first && (newVoltage < 12.10 && newVoltage > 11.6)) {
        postToSlack(50, battery, batteryId, newVoltage)
      }

      // Battery is at about 20%, but below 50%: send second notification
      if (!battery.notificationsSent.second && newVoltage <= 11.6) {
        postToSlack(20, battery, batteryId, newVoltage)
      }
    })
    .catch(err => console.error(`Error finding document: ${err}`))
}

// Post to Slack using a webhook
const postToSlack = (chargeLevel, batteryData, batteryId, newVoltage) => {
  const url = process.env.SLACK_WEBHOOK_URL
  const payload = {
    attachments: [
      {
        fallback: `${batteryData.name} is at ${chargeLevel}% charge (${newVoltage} Volt)`,
        color: `${chargeLevel === 50 ? '#F2C744' : '#F44336'}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${batteryData.name}* is at *${chargeLevel}%* charge (${batteryData.latestVoltage} Volt) \n _${batteryData.manufacturer}, ${batteryData.model} (${batteryData.capacity} Ah)_`
            }
          }
        ]
      }
    ]
  }
  axios.post(url, JSON.stringify(payload))
    .then(() => {
      docRefBatteries.doc(batteryId).update({
        notificationsSent: {
          first: true,
          second: charge === 50 ? false : true
        }
      })
      .catch(err => console.error(`Error updating notification status: ${err}`))
    })
    .catch(err => console.error(`Error sending notification: ${error}`))
}

module.exports = router