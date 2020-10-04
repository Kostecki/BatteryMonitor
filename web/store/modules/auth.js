import firebase from 'firebase/app'
import 'firebase/auth'

export const state = () => ({
  authenticated: false
})

export const mutations = {
  authenticated: (state, payload) => {
    state.authenticated = payload
  }
}

export const actions = {
  signIn: ({ state, commit }, payload) => {
    commit('modules/shared/loading', true, { root: true })

    const { email, password } = payload

    // eslint-disable-next-line
    new Promise((resolve, reject) => {
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then(
          () => {
            commit('modules/shared/loading', false, { root: true })
            commit('authenticated', true)

            resolve()
          }
        )
        .catch((error) => {
          commit('authenticated', false)
          commit('modules/shared/loading', false, { root: true })
          commit('modules/shared/setMessage', { error: error.message, type: 'error' }, { root: true })

          reject(error)
        })
    })
  },
  autoSignIn: ({ commit }) => {
    // eslint-disable-next-line
    new Promise(resolve => {
      commit('authenticated', true)
      resolve()
    })
  },
  signOut: ({ commit }) => {
    // eslint-disable-next-line
    new Promise((resolve, reject) => {
      firebase.auth().signOut()
        .then(() => {
          commit('authenticated', false)
          resolve()
        })
        .catch((error) => {
          commit('modules/shared/setMessage', {
            error: error.message, type: 'error'
          }, { root: true })
          reject(error)
        })
    })
  }
}
