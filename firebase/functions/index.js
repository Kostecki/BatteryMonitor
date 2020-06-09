const functions = require('firebase-functions')
const admin = require('firebase-admin')
const axios = require('axios')

const func = functions.region('europe-west1')
admin.initializeApp()

const calcBatteryCharge = voltage => {
  if (voltage >= 12.73) {
    return 100;
  } else if (voltage >= 12.62) {
    return 90;
  } else if (voltage >= 12.50) {
    return 80;
  } else if (voltage >= 12.37) {
    return 70;
  } else if (voltage >= 12.24) {
    return 60;
  } else if (voltage >= 12.10) {
    return 50;
  } else if (voltage >= 11.96) {
    return 40;
  } else if (voltage >= 11.81) {
    return 30;
  } else if (voltage >= 11.66) {
    return 20;
  } else if (voltage >= 11.51) {
    return 10;
  } else {
    return 0;
  }
}

// Add new voltage measurement to Firestore
exports.addMeasurement = func.https.onRequest((request, response) => {
  const { batteryID, voltage } = request.body
  
  admin.firestore().collection('measurements').add({
    batteryID,
    voltage,
    updated: admin.firestore.FieldValue.serverTimestamp()
  })
  .then(docRef => {
    return response.status(200).send(`Document written with ID: ${docRef.id}`)
  })
  .catch(error => {
    return response.status(500).send(`Error adding document: ${error}`)
  })
})

// Update latestVoltage-field of given battery with newest voltage measurement
exports.updateLatestVoltage = func.firestore.document('/measurements/{id}')
  .onCreate(snap => {
    const { batteryID, voltage } = snap.data()

    admin.firestore().collection('batteries').doc(batteryID).update({
      latestVoltage: voltage
    })
    .then(docRef => {
      return `Document with id ${docRef.id} updated with new latestVoltage: ${voltage}`
    })
    .catch(error => {
      console.error(`Error updating document: ${error}`) 
    })
  })

// Send notification if voltage is below threshold
exports.sendNotification = func.firestore.document('/measurements/{id}')
  .onCreate(snap => {
    const { batteryID, voltage } = snap.data()
    const curBattery = admin.firestore().collection('batteries').doc(batteryID)

    curBattery.get()
      .then(doc => {
        if (doc.exists) {
          const curBatteryData = doc.data()

          // Battery seems to be charging. Reset notification-triggers
          if (voltage > 12.5) {
            curBattery.update({
              notificationsSent: {
                first: false,
                second: false
              }
            })
          }

          // Battery is at about 50%, but above 20%: send first notfication
          if (!curBatteryData.notificationsSent.first && (voltage < 12.10 && voltage > 11.6)) {
            postToSlack(50, curBattery, curBatteryData)
          }

          // Battery is at about 20%, but below 50%: send second notification
          if (!curBatteryData.notificationsSent.second && voltage <= 11.6) {
            postToSlack(20, curBattery, curBatteryData)
          }
        } else {
          console.error(`Error getting document: ${error}`)
        }

        return null
      })
      .catch(error => console.error(`Error getting document: ${error}`))

  return null
})

// Send notification to Slack channel
const postToSlack = (charge, curBattery, curBatteryData) => {
  const url = functions.config().batterymonitor.slackurl
  const payload = {
    attachments: [
      {
        fallback: `${curBatteryData.name} is at ${charge}% charge (${curBatteryData.latestVoltage} Volt)`,
        color: `${charge === 50 ? '#F2C744' : '#F44336'}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${curBatteryData.name}* is at *${charge}%* charge (${curBatteryData.latestVoltage} Volt) \n _${curBatteryData.manufacturer}, ${curBatteryData.model} (${curBatteryData.capacity} Ah)_`
            }
          }
        ]
      }
    ]
  }
  
  return axios.post(url, JSON.stringify(payload))
    .then(() => {
      console.log('after axios')
      return curBattery.update({
        notificationsSent: {
          first: true,
          second: charge === 50 ? false : true
        }
      })
    })
    .catch(error => console.error(`Error sending notification: ${error}`))
}

// Slack slash-command response for /status
exports.allBatteriesStatus = func.https.onRequest((request, response) => {
  returnRealReply(request.body.response_url)

  payload = {
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "plain_text",
          "text": ":hourglass_flowing_sand: Getting status for all batteries..",
          "emoji": true
        }
      },
      {
        "type": "context",
        "elements": [
          {
            "type": "mrkdwn",
            "text": "_This might take a while as we wait for Firebase to do it's thing_"
          }
        ]
      }
    ]
  }

  response.status(200).send(payload)
})

const returnRealReply = responseUrl => {
  const payload = {
    blocks: [
      {
        type: "section",
        fields: []
      }
    ]
  }

  admin.firestore().collection('batteries').get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        const battery = doc.data()

        payload.blocks[0].fields.push({
          type: 'mrkdwn',
          text: `*${battery.name} (_${calcBatteryCharge(battery.latestVoltage)}%, ${battery.latestVoltage} Volt_)* \n _${battery.manufacturer}, ${battery.model} (${battery.capacity} Ah)_`
        })
      })

      return axios.post(responseUrl, JSON.stringify(payload))
    })
    .catch(error => console.error(error))
}