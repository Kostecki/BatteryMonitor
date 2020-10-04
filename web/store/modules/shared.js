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
  setAlert: (state, payload) => {
    state.alert = payload
  },
  clear: (state) => {
    state.alert = {
      visible: false,
      type: null,
      message: null,
      timeout: null
    }
  }
}

export const actions = {
  toggleAlert: ({ commit, state }, payload) => {
    commit('setAlert', {
      visible: payload.visible,
      type: payload.type,
      message: payload.message,
      timeout: payload.timeout || 3000
    })
  },
  clearAlert: ({ commit, state }) => {
    commit('clear')
  }
}
