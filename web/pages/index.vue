<template>
  <v-row>
    <v-col
      v-for="battery in sortedBatteries"
      :key="battery.name"
      cols="12"
      sm="8"
      offset-sm="2"
      offset-md="0"
      md="6"
      lg="5"
      offset-lg="1"
      offset-xl="0"
      xl="3"
      align="center"
    >
      <v-card class="px-4">
        <v-row align="center" no-gutters>
          <v-col cols="3" class="d-flex justify-center battery-percentage" :style="{color: setChargeColor(battery.latestVoltage) }">
            <h1>
              {{ calcBatteryCharge(battery.latestVoltage) }}%
            </h1>
          </v-col>
          <v-col cols="9" class="card-main-content">
            <v-card-title>
              {{ battery.name }} ({{ battery.capacity }} Ah)
            </v-card-title>
            <v-card-subtitle>
              <div>{{ `${battery.manufacturer}, ${battery.model}` }}</div>
              <div>{{ `Charge: ${battery.latestVoltage} Volt` }}</div>
            </v-card-subtitle>
          </v-col>
          <div class="border-notification notification-first" :class="setNotificationStatus(battery, 'first')" />
          <div class="border-notification notification-second" :class="setNotificationStatus(battery, 'second')" />
        </v-row>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import utils from '../utils/helperFunctions'

export default {
  components: {},
  fetch () {
    return this.bindBatteries()
  },
  data () {
    return {}
  },
  computed: {
    ...mapState(['allBatteries']),
    sortedBatteries () {
      return [...this.allBatteries].sort((a, b) => a.latestVoltage - b.latestVoltage)
    }
  },
  beforeDestroy () {
    this.unbindBatteries()
  },
  methods: {
    ...mapActions(['bindBatteries', 'unbindBatteries']),
    calcBatteryCharge: utils.calcBatteryCharge,
    setChargeColor: utils.setChargeColor,
    setNotificationStatus (battery, position) {
      if (position === 'first' && battery.notificationsSent.first) {
        return 'first-notification-sent'
      } else if (position === 'second' && battery.notificationsSent.second) {
        return 'second-notification-sent'
      }
    }
  },
  head () {
    return {
      title: 'Home'
    }
  }
}
</script>

<style>
  .card-main-content {
    text-align: left;
  }

  .border-notification {
    position: absolute;
    width: 8px;
    height: 50%;
    right: 0;
  }

  .notification-first {
    top: 0;
    background: rgba(255, 214, 0, 0.1);
    border-top-right-radius: 4px;
  }

  .notification-second {
    top: 50%;
    background: rgba(244, 67, 54, 0.1);
    border-bottom-right-radius: 4px;
  }

  .first-notification-sent {
    background: rgba(255, 214, 0, 1);
  }
  .second-notification-sent {
    background: rgba(244, 67, 54, 1);
  }
</style>
