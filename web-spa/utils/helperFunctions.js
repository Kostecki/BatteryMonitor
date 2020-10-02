const colors = require('vuetify/lib/util/colors')

module.exports = {
  calcBatteryCharge: (voltage) => {
    switch (true) {
      case voltage >= 12.73:
        return 100
      case voltage >= 12.62:
        return 90
      case voltage >= 12.50:
        return 80
      case voltage >= 12.37:
        return 70
      case voltage >= 12.24:
        return 60
      case voltage >= 12.10:
        return 50
      case voltage >= 11.96:
        return 40
      case voltage >= 11.81:
        return 30
      case voltage >= 11.66:
        return 20
      case voltage >= 11.51:
        return 10
      default:
        return 0
    }
  },
  setChargeColor: (voltage) => {
    if (voltage >= 12.24) {
      return colors.default.green.base
    } else if (voltage > 11.66) {
      return colors.default.yellow.accent4
    } else {
      return colors.default.red.base
    }
  }
}
