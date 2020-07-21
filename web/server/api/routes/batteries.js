import { Router } from 'express'
import axios from 'axios'
const admin = require('firebase-admin');
const router = Router()

import { calcBatteryCharge } from '../../../utils/helperFunctions'

const serviceAccount = require('../../../secrets/serviceAccountKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://batterymonitor-2b1c4.firebaseio.com"
});

const db = admin.firestore()
const docRefBatteries = db.collection('batteries')
const docRefMeasurements = db.collection('measurements')

/**
 * @Swagger
 * tags:
 *  name: Batteries
 *  description: CRUD information on single or multiple batteries
 */

// GET single battery by id
/**
 * @swagger
 *
 * /battery/{batteryId}:
 *   get:
 *     tags: [Batteries]
 *     summary: "Get information about a single battery"
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: batteryId
 *         in: path
 *         description: "ID of the battery to be fetched"
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Single battery details
 *         examples:
 *          application/json: { "name": "Cloud Raven", "lastSeen": null, "latestVoltage": 12.3, "createdAt": { "_seconds": 1591739962, "_nanoseconds": 779000000 }, "model": "GF 12 105 V", "notificationsSent": { "first": false, "second": false }, "capacity": 120, "manufacturer": "Sonnenschein", "updatedAt": { "_seconds": 1595000229, "_nanoseconds": 421000000 } }
 */
router.get('/battery/id', (req, res) => {
  const id = req.params.id

  docRefBatteries.doc(id).get()
    .then(doc => res.status(200).json(doc.data()))
    .catch(err => res.status(500).send(`Error getting batteries: ${err}`))
})

// GET all batteries
/**
 * @swagger
 *
 * /batteries:
 *   get:
 *     tags: [Batteries]
 *     summary: "Get information about all batteries"
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Information on all batteries
 *         examples:
 *          application/json: [{ "name": "Cloud Raven", "lastSeen": null, "latestVoltage": 12.3, "createdAt": { "_seconds": 1591739962, "_nanoseconds": 779000000 }, "model": "GF 12 105 V", "notificationsSent": { "first": false, "second": false }, "capacity": 120, "manufacturer": "Sonnenschein", "updatedAt": { "_seconds": 1595000229, "_nanoseconds": 421000000 } } ]
 */
router.get('/batteries', (req, res) => {
  docRefBatteries.get()
    .then(snapshot => res.status(200).json(snapshot.docs.map(doc => doc.data())))
    .catch(err => res.status(500).send(`Error getting batteries: ${err}`))
})

// POST to create battery
/**
 * @swagger
 *
 * /batteries:
 *   post:
 *     tags: [Batteries]
 *     summary: "Create new battery"
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: body
 *         schema:
 *            type: object
 *            required:
 *              - capacity
 *              - model
 *              - name
 *              - latestVoltage
 *              - manufacturer
 *            properties:
 *              capacity:
 *                type: number
 *                format: float
 *              model:
 *                type: string
 *              name:
 *                type: string
 *              latestVoltage:
 *                type: number
 *                format: float
 *              manufacturer:
 *                type: string
 *     responses:
 *       200:
 *         description: Information on all batteries
 *         examples:
 *          application/json: [{ "name": "Cloud Raven", "lastSeen": null, "latestVoltage": 12.3, "createdAt": { "_seconds": 1591739962, "_nanoseconds": 779000000 }, "model": "GF 12 105 V", "notificationsSent": { "first": false, "second": false }, "capacity": 120, "manufacturer": "Sonnenschein", "updatedAt": { "_seconds": 1595000229, "_nanoseconds": 421000000 } } ]
 */
router.post('/battery', (req, res) => {
  const {
    name,
    manufacturer,
    model,
    capacity,
    latestVoltage
  } = req.body

  const timestamp = admin.firestore.FieldValue.serverTimestamp()

  docRefBatteries.add({
    name,
    manufacturer,
    model,
    capacity,
    latestVoltage,
    notificationsSent: {
      first: false,
      second: false
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    lastSeen: null
  })
  .then(ref => {
    docRefBatteries.doc(ref.id).get()
      .then(snapshot => res.status(201).json(snapshot.data()))
      .catch(err => res.status(500).send(`Error getting newly created battery: ${err}`))
  })
  .catch(err => res.status(500).send(`Error creating new battery: ${err}`))
})

// PUT to update battery
router.put('/battery', (req, res) => {
  const {
    id,
    name,
    manufacturer,
    model,
    capacity,
    latestVoltage
  } = req.body

  const timestamp = admin.firestore.FieldValue.serverTimestamp()

  docRefBatteries.doc(id).update({
    name,
    manufacturer,
    model,
    capacity,
    latestVoltage,
    updatedAt: timestamp
  })
  .then(() => {
    docRefBatteries.doc(id).get()
      .then(snapshot => res.status(200).json(snapshot.data()))
      .catch(err => res.status(500).send(`Error getting newly updated battery: ${err}`))
  })
  .catch(err => res.status(500).send(`Error updating battery: ${err}`))
})

// DELETE to delete battery
router.delete('/battery/:id', (req, res) => {
  console.log('delete')
  const id = req.params.id

  docRefBatteries.doc(id).delete()
    .then(() => res.status(204).send())
    .catch(err => res.status(500).send(`Error deleting battery: ${err}`))
})

// POST to create measurement
router.post('/measurement', (req, res) => {
  const { batteryId, voltage } = req.body

  docRefMeasurements.add({
    batteryId,
    voltage,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })
  .then(ref => {
    docRefMeasurements.doc(ref.id).get()
      .then(snapshot => {
        setLatestVoltage(batteryId, voltage)
        sendNotification(batteryId, voltage)
        res.status(201).json(snapshot.data())
      })
      .catch(err => res.status(500).send(`Error getting newly created measurement: ${err}`))
  })
  .catch(err => res.status(500).send(`Error creating new measurement: ${err}`))
})

// Slack slash-command response with status for all batteries
router.post('/batteriesSlack', (req, res) => {
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

// POST to updated "lastSeen" value of battery
router.post('/heartbeat', (req, res) => {
  const { batteryId } = req.body

  docRefBatteries.doc(batteryId).update({
    lastSeen: admin.firestore.FieldValue.serverTimestamp()
  })
  .then(() => res.status(200).send())
  .catch(err => res.status(500).send(`Error handling heartbeat: ${err}`))
})

/* "Triggers" */
// Update given battery with new "latestVoltage"
const setLatestVoltage = (batteryId, newVoltage) => {
  const update = { latestVoltage: newVoltage, updatedAt: admin.firestore.FieldValue.serverTimestamp() }

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
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
          second: chargeLevel === 50 ? false : true
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })
      .catch(err => console.error(`Error updating notification status: ${err}`))
    })
    .catch(err => console.error(`Error sending notification: ${err}`))
}

module.exports = router