
import { Router } from 'express'
import { ObjectId } from "mongodb"
import mongoose from 'mongoose'
import axios from 'axios'

import { calcBatteryCharge } from '../../../utils/helperFunctions'

const router = Router()

mongoose.set('useFindAndModify', false);
mongoose.connect('mongodb://192.168.1.5/batteryMonitor', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// Schema definitions
const Schema = mongoose.Schema

// Batteries
const BatteriesSchema = new Schema({
  name: String,
  manufacturer: String,
  model: String,
  capacity: Number,
  latestVoltage: Number,
  notificationsSent: Object
}, {
  collection: 'batteries',
  timestamps: true
})

// Measurements
const MeasurementsSchema = new Schema({
  batteryId: ObjectId,
  voltage: Number
}, {
  collection: 'measurements',
  timestamps: true
})

const BatteriesModel = mongoose.model('battery', BatteriesSchema)
const MeasurementsModel = mongoose.model('measurement', MeasurementsSchema)

// GET single battery by _id
router.get('/battery/:id', (req, res, next) => {
  const _id = ObjectId(req.params.id)

  BatteriesModel.findOne({'_id': _id}, (err, doc) => {
    if (err) return res.status(500).send(`Error getting batteries: ${err}`)
    return res.status(200).send(doc)
  })
})

// GET all batteries
router.get('/batteries', (req, res, next) => {
  BatteriesModel.find({}, (err, doc) => {
    if (err) return res.status(500).send(`Error getting batteries: ${err}`)
    return res.status(200).send(doc)
  })
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

  const battery = new BatteriesModel({
    name,
    manufacturer,
    model,
    capacity,
    latestVoltage,
    notificationsSent
  })

  battery.save((err, doc) => {
    if (err) return res.status(500).send(`Error inserting document: ${err}`)
    res.status(200).json(doc)
  })
})

// POST to create measurement
router.post('/measurement', (req, res, next) => {
  const { batteryId, voltage } = req.body
  const measurement = new MeasurementsModel({
    batteryId,
    voltage
  })

  measurement.save((err, doc) => {
    if (err) {
      return res.status(500).send(`Error inserting document: ${err}`)
    } else {
      setLatestVoltage(batteryId, voltage)
      sendNotification(batteryId, voltage)
      res.status(200).json(doc) 
    }
  })
})

router.get('/batteriesSlack', (req, res, next) => {
  const payload = {
    blocks: [
      {
        type: "section",
        fields: []
      }
    ]
  }

  BatteriesModel.find({}, (err, batteries) => {
    if (err) return res.status(500).send(`Error finding batteries: ${err}`)

    batteries.forEach(battery => {
      payload.blocks[0].fields.push({
        type: 'mrkdwn',
        text: `*${battery.name} (_${calcBatteryCharge(battery.latestVoltage)}%, ${battery.latestVoltage} Volt_)* \n _${battery.manufacturer}, ${battery.model} (${battery.capacity} Ah)_`
      })
    })

    res.send(payload)
  })
})

/* "Triggers" */
// Update given battery with new "latestVoltage"
const setLatestVoltage = (batteryId, newVoltage) => {
  const update = { latestVoltage: newVoltage }

  BatteriesModel.findByIdAndUpdate(ObjectId(batteryId), update, { new: true }, (err) => {
    if (err) console.error(error)
  })
}

// Determine if a notification should be sent 
const sendNotification = (batteryId, newVoltage) => {
  BatteriesModel.findById(ObjectId(batteryId), (err, battery) => {
    if (err) console.error(`Error finding document: ${err}`)

    // Battery seems to be charging. Reset notification-triggers
    if (newVoltage > 12.5) {
      battery.updateOne({
        notificationsSent: {
          first: false,
          second: false
        }
      }, (err) => {
        if (err) console.error(`Error updating notificationsSent: ${err}`)
      })
    }

    // Battery is at about 50%, but above 20%: send first notfication
    if (!battery.notificationsSent.first && (newVoltage < 12.10 && newVoltage > 11.6)) {
      postToSlack(50, battery)
    }

    // Battery is at about 20%, but below 50%: send second notification
    if (!battery.notificationsSent.second && newVoltage <= 11.6) {
      postToSlack(20, battery)
    }
  })
}

// Post to Slack using a webhook
const postToSlack = (charge, batteryRef) => {
  const url = process.env.SLACK_WEBHOOK_URL
  const payload = {
    attachments: [
      {
        fallback: `${batteryRef.name} is at ${charge}% charge (${batteryRef.latestVoltage} Volt)`,
        color: `${charge === 50 ? '#F2C744' : '#F44336'}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${batteryRef.name}* is at *${charge}%* charge (${batteryRef.latestVoltage} Volt) \n _${batteryRef.manufacturer}, ${batteryRef.model} (${batteryRef.capacity} Ah)_`
            }
          }
        ]
      }
    ]
  }

  axios.post(url, JSON.stringify(payload))
    .then(() => {
      batteryRef.updateOne({
        notificationsSent: {
          first: true,
          second: charge === 50 ? false : true
        }
      }, (err => {
        if (err) console.error(`Error updating notification status: ${err}`)
      }))
    })
    .catch(error => console.error(`Error sending notification: ${error}`))
}

module.exports = router