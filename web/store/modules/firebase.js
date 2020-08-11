import { firestoreAction } from 'vuexfire'
import { db } from '../../firebase'

export const state = () => ({
  batteries: []
})

export const actions = {
  bindBatteries: firestoreAction(({ bindFirestoreRef }) => {
    return bindFirestoreRef('batteries', db.collection('batteries'))
  }),
  unbindBatteries: firestoreAction(({ unbindFirestoreRef }) => {
    unbindFirestoreRef('batteries')
  })
}
