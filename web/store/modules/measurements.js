import firebase, { refMeasurements } from '../../plugins/firebase'

export const state = () => ({
  measurements: [],
  loading: true
})

export const mutations = {
  setLoading: (state, payload) => {
    state.loading = payload
  },
  setMeasurements: (state, payload) => {
    state.measurements = payload
  }
}

export const actions = {
  getMeasurements: ({ state, commit }, batteryId) => {
    // eslint-disable-next-line
    return new Promise((resolve, reject) => {
      commit('setLoading', true)
      refMeasurements
        .orderByChild('batteryId')
        .equalTo(batteryId)
        .on('value', (snapshot) => {
          const data = []
          snapshot.forEach((m) => {
            data.push({
              ...m.val(),
              id: m.key
            })
          })
          commit('setMeasurements', data)
          commit('setLoading', false)
          resolve(data)
        })
    })
  },
  addMeasurement: ({ state, commit }, payload) => {
    // eslint-disable-next-line
    return new Promise((resolve, reject) => {
      const ts = firebase.database.ServerValue.TIMESTAMP
      const { batteryId, voltage } = payload

      const newMeasurement = refMeasurements.push({
        batteryId,
        createdAt: ts,
        voltage
      }, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve(newMeasurement.key)
        }
      })
    })
  }
}
