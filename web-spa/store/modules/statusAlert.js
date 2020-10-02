export const state = () => ({
  showAlert: false,
  alertType: null,
  alertMessage: null,
  alertTimeout: null
})

export const mutations = {
  toggleAlert (state, payload) {
    const {
      showAlert,
      alertType,
      alertMessage,
      alertTimeout
    } = payload

    state.showAlert = showAlert
    state.alertType = alertType
    state.alertMessage = alertMessage
    state.alertTimeout = alertTimeout || 3000
  }
}
