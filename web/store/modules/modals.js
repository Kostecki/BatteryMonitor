export const state = () => ({
  selectedBattery: null,
  batteryModal: {
    visible: false,
    mode: null,
    title: null
  }
})

export const mutations = {
  toggleBatteryModal (state, mode) {
    state.batteryModal.visible = !state.batteryModal.visible
    state.batteryModal.mode = mode

    switch (mode) {
      case 'add':
        state.batteryModal.title = 'Add New Battery'
        break

      case 'edit':
        state.batteryModal.title = 'Edit Battery'
        break

      default:
        state.batteryModal.mode = null
        state.batteryModal.title = null
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
