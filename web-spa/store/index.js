import { vuexfireMutations } from 'vuexfire'

export const state = () => ({
  loggedIn: true
})

export const mutations = {
  ...vuexfireMutations
}

export const actions = {}
