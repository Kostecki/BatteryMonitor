export const state = () => ({
  batteryModalVisible: false,
  modalState: {
    mode: null,
    title: null
  },
  selectedBattery: null
})

export const mutations = {
  toggleBatteryModal (state, mode) {
    state.batteryModalVisible = !state.batteryModalVisible

    switch (mode) {
      case 'add':
        state.modalState.mode = 'add'
        state.modalState.title = 'Add New Battery'
        break

      case 'edit':
        state.modalState.mode = 'edit'
        state.modalState.title = 'Edit Battery'
        break

      default:
        state.modalState.mode = null
        state.modalState.title = null
        break
    }
  },
  selectBattery (state, battery) {
    state.selectedBattery = battery
  },
  deselectBattery (state) {
    state.selectedBattery = null
  }
}

export const actions = {}
