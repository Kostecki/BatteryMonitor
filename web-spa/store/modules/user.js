import firebase from 'firebase/app'
import 'firebase/auth'

export const state = () => ({
  user: null,
  authenticated: false
})

export const getters = {
  isAuthenticated: (state) => {
    console.log(state.user)
    return state.user !== null && state.user !== undefined
  }
}

export const mutations = {
  user: (state, payload) => {
    state.user = payload
  },
  authenticated: (state, payload) => {
    state.authenticated = payload
  }
}

export const actions = {
  signIn: ({ commit }, payload) => {
    console.log('signIn')
    // commit('shared/loading', true, { root: true })
    firebase.auth().signInWithEmailAndPassword(payload.email, payload.password)
      .then(
        (user) => {
          // commit('shared/loading', false, { root: true })
          commit('user', {
            id: user.user.id,
            email: user.user.email
          })
          commit('authenticated', true)
        }
      )
      .catch((error) => {
        console.error(error)
        commit('authenticated', false)
        // commit('shared/loading', false, { root: true })
        // commit('shared/setMessage', { text: error.message, type: 'error' }, { root: true })
      })
  },
  autoSignIn: ({ commit }, payload) => {
    console.log('autoSignIn')
    console.log(payload)
    commit('user', {
      id: payload.uid,
      email: payload.email
    })
    commit('authenticated', true)
  },
  signOut: ({ commit }) => {
    firebase.auth().signOut()
    commit('user', null)
    commit('authenticated', false)
    // this.router.push({ path: '/' })
  }
}
