import { Router } from 'express'
import axios from 'axios'
import admin from 'firebase-admin'
import { calcBatteryCharge } from '../../../utils/helperFunctions'

const router = Router()

const serviceAccount = require('../../../secrets/serviceAccountKey.json')

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL
  })
}

const refBatteries = admin.database().ref('batteries')
const refMeasurements = admin.database().ref('measurements')
const timestamp = admin.database.ServerValue.TIMESTAMP

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
router.get('/battery/:id', (req, res) => {
  const id = req.params.id

  refBatteries.orderByKey().equalTo(id).once('value')
    .then(snapshot => res.status(200).json(snapshot.val()))
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
  refBatteries.once('value')
    .then(snapshot => res.status(200).json(snapshot.val()))
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

  refBatteries.push({
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
    .then((newBattery) => {
      refBatteries.orderByKey().equalTo(newBattery.key).once('value')
        .then(snapshot => res.status(201).json(snapshot.val()))
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

  refBatteries.child(id).update({
    name,
    manufacturer,
    model,
    capacity,
    latestVoltage,
    updatedAt: timestamp
  })
    .then(() => {
      refBatteries.orderByKey().equalTo(id).once('value')
        .then(snapshot => res.status(201).json(snapshot.val()))
        .catch(err => res.status(500).send(`Error getting newly created battery: ${err}`))
    })
    .catch(err => res.status(500).send(`Error creating new battery: ${err}`))
})

// DELETE to delete battery
router.delete('/battery/:id', (req, res) => {
  const id = req.params.id

  refBatteries.child(id).remove()
    .then(() => res.status(204).send())
    .catch(err => res.status(500).send(`Error deleting battery: ${err}`))
})

// POST to create measurement
router.post('/measurement', (req, res) => {
  const { batteryId, voltage } = req.body

  refMeasurements.push({
    batteryId,
    voltage,
    createdAt: timestamp
  })
    .then((newMeasurement) => {
      refMeasurements.orderByKey().equalTo(newMeasurement.key).once('value')
        .then((snapshot) => {
          setLatestVoltage(batteryId, voltage)
          sendNotification(batteryId, voltage)
          res.status(201).json(snapshot.val())
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
        type: 'section',
        fields: []
      }
    ]
  }

  const batteryList = []

  refBatteries.once('value')
    .then((snapshot) => {
      console.log('forEach')
      snapshot.forEach((battery) => {
        batteryList.push(battery.val())
      })
      batteryList.sort((a, b) => a.latestVoltage - b.latestVoltage).reverse() // Sort by Latest Voltage (largest first)

      batteryList.forEach((battery) => {
        payload.blocks[0].fields.push({
          type: 'mrkdwn',
          text: `*${battery.name} (_${calcBatteryCharge(battery.latestVoltage)}%, ${battery.latestVoltage} Volt_)* \n _${battery.manufacturer}, ${battery.model} (${battery.capacity} Ah)_`
        })
      })

      res.status(200).json(payload)
    })
    .catch(err => res.status(500).send(`Error getting batteries: ${err}`))
})

// POST to update "lastSeen" value of battery
router.post('/heartbeat', (req, res) => {
  const { batteryId } = req.body

  refBatteries.child(batteryId).update({
    lastSeen: timestamp
  })
    .then(() => res.status(200).send())
    .catch(err => res.status(500).send(`Error handling heartbeat: ${err}`))
})

/* "Triggers" */
// Update given battery with new "latestVoltage"
const setLatestVoltage = (batteryId, newVoltage) => {
  const update = { latestVoltage: newVoltage, updatedAt: timestamp }

  refBatteries.child(batteryId).update(update)
    .catch(err => console.error(err))
}

// Determine if a notification should be sent
const sendNotification = (batteryId, newVoltage) => {
  refBatteries.orderByKey().equalTo(batteryId).once('value')
    .then((snapshot) => {
      const battery = snapshot.val()[Object.keys(snapshot.val())]
      if (newVoltage > 12.5) {
        refBatteries.child(batteryId).update({
          notificationsSent: {
            first: false,
            second: false
          },
          updatedAt: timestamp
        })
          .catch(err => console.error(`Error updating notificationsSent: ${err}`))
      }

      console.log(battery.notificationsSent, newVoltage)

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
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${batteryData.name}* is at *${chargeLevel}%* charge (${batteryData.latestVoltage} Volt) \n _${batteryData.manufacturer}, ${batteryData.model} (${batteryData.capacity} Ah)_`
            }
          }
        ]
      }
    ]
  }
  axios.post(url, JSON.stringify(payload))
    .then(() => {
      refBatteries.child(batteryId).update({
        notificationsSent: {
          first: true,
          second: chargeLevel !== 50
        },
        updatedAt: timestamp
      })
        .catch(err => console.error(`Error updating notification status: ${err}`))
    })
    .catch(err => console.error(`Error sending notification: ${err}`))
}

module.exports = router
