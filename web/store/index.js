import { vuexfireMutations, firestoreAction } from 'vuexfire'
import { db } from '../firebase'

export const state = () => ({
  allBatteries: []
})

export const mutations = {
  ...vuexfireMutations
}

export const actions = {
  bindBatteries: firestoreAction(({ bindFirestoreRef }) => {
    return bindFirestoreRef('allBatteries', db.collection('batteries'))
  }),
  unbindBatteries: firestoreAction(({ unbindFirestoreRef }) => {
    unbindFirestoreRef('allBatteries')
  })
}
