import firebase, { refBatteries } from '../../plugins/firebase'

export const state = () => ({
  batteries: [],
  loading: true
})

export const mutations = {
  setLoading: (state, payload) => {
    state.loading = payload
  },
  setBatteries: (state, payload) => {
    state.batteries = payload
  }
}

export const actions = {
  getBatteries: ({ state, commit }) => {
    commit('setLoading', true)
    refBatteries.on('value', (snapshot) => {
      const data = []
      snapshot.forEach((batt) => {
        data.push({
          ...batt.val(),
          id: batt.key
        })
      })
      commit('setBatteries', data)
      commit('setLoading', false)
    })
  },
  addBattery: ({ state, commit }, payload) => {
    // eslint-disable-next-line
    return new Promise((resolve, reject) => {
      const ts = firebase.database.ServerValue.TIMESTAMP
      const { name, manufacturer, model, capacity, latestVoltage, voltageDividerRatio } = payload

      const newBatteryRef = refBatteries.push({
        name,
        manufacturer,
        model,
        capacity,
        latestVoltage,
        notificationsSent: {
          first: false,
          second: false
        },
        createdAt: ts,
        updatedAt: ts,
        lastSeen: null,
        voltageDividerRatio
      })
        .then(() => resolve(newBatteryRef.key))
        .catch(error => reject(error))
    })
  },
  editBattery: ({ state, commit }, payload) => {
    // eslint-disable-next-line
    return new Promise((resolve, reject) => {
      refBatteries.child(payload.id).update(payload)
        .then(() => resolve())
        .catch(error => reject(error))
    })
  },
  deleteBattery: ({ state, commit }, batteryId) => {
    // eslint-disable-next-line
    return new Promise((resolve, reject) => {
      refBatteries.child(batteryId).remove()
        .then(() => resolve())
        .catch(error => reject(error))
    })
  }
}
