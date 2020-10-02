import { firestoreAction } from 'vuexfire'
import { db } from '../../firebase'

export const state = () => ({
  batteries: [],
  measurements: []
})

export const actions = {
  bindBatteries: firestoreAction(({ bindFirestoreRef }) => {
    return bindFirestoreRef('batteries', db.collection('batteries'))
  }),
  unbindBatteries: firestoreAction(({ unbindFirestoreRef }) => {
    unbindFirestoreRef('batteries')
  }),
  bindMeasurements: firestoreAction(({ bindFirestoreRef }, filter) => {
    if (filter) {
      return bindFirestoreRef(
        'measurements',
        db
          .collection('measurements')
          .where('batteryId', '==', filter)
          .orderBy('createdAt')
      )
    } else {
      return bindFirestoreRef(
        'measurements',
        db
          .collection('measurements')
      )
    }
  }),
  unbindMeasurements: firestoreAction(({ unbindFirestoreRef }) => {
    unbindFirestoreRef('measurements')
  })
}