export const state = () => ({
  measurementModalVisible: false
})

export const mutations = {
  toggleMeasurementModal (state) {
    state.measurementModalVisible = !state.measurementModalVisible
  }
}
