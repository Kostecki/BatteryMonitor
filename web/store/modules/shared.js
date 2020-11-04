export const state = () => ({
  loading: false,
  alert: {
    visible: false,
    type: null,
    message: null,
    timeout: null
  }
})

export const mutations = {
  loading: (state, payload) => {
    state.loading = payload
  },
  toggleAlert: (state, payload) => {
    state.alert = {
      visible: payload.visible,
      type: payload.type,
      message: payload.message,
      timeout: payload.timeout || 3000
    }
  },
  clearAlert: (state) => {
    state.alert = {
      visible: false,
      type: null,
      message: null,
      timeout: null
    }
  }
}
