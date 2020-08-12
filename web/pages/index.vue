<template>
  <v-row>
    <v-col
      v-if="loading"
      align="center"
    >
      <v-progress-circular
        indeterminate
        color="primary"
      />
    </v-col>
    <div class="wrap d-flex flex-wrap" v-else>
      <!-- <v-col cols="12">
        <v-toolbar dense>
          <v-btn icon>
            <v-icon>mdi-magnify</v-icon>
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn icon>
            <v-icon>mdi-heart</v-icon>
          </v-btn>
          <v-btn icon>
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </v-toolbar>
      </v-col> -->
      <v-col
        v-for="battery in sortedBatteries"
        :key="battery.name"
        cols="12"
        sm="8"
        md="6"
        lg="5"
        xl="3"
        align="center"
        class="single-battery-card"
      >
        <v-card class="px-4" @click="cardClick(battery)">
          <v-row align="center" no-gutters>
            <v-col cols="3" class="d-flex flex-column justify-center" :style="{color: setChargeColor(battery.latestVoltage) }">
              <div class="battery-charge">{{ calcBatteryCharge(battery.latestVoltage) }}%</div>
              <div class="latest-voltage">{{ battery.latestVoltage.toFixed(2) }} V</div>
            </v-col>
            <v-col cols="9" class="card-main-content">
              <v-card-title>
                {{ battery.name }} ({{ battery.capacity }} Ah)
              </v-card-title>
              <v-card-subtitle>
                <div>{{ `${battery.manufacturer}, ${battery.model}` }}</div>
                <!-- <div>Charge: {{ battery.latestVoltage }} Volt</div> -->
                <div class="last-seen">
                  Updated: {{ formatTime(battery.updatedAt) }}
                </div>
              </v-card-subtitle>
            </v-col>
            <div class="border-notification notification-first" :class="setNotificationStatus(battery, 'first')" />
            <div class="border-notification notification-second" :class="setNotificationStatus(battery, 'second')" />
          </v-row>
        </v-card>
      </v-col>
    </div>
    <batteryModal />
    <measurementModal />
  </v-row>
</template>

<script>
import advancedFormat from 'dayjs/plugin/advancedFormat'
import { mapActions, mapState, mapMutations } from 'vuex'
import utils from '../utils/helperFunctions'
import batteryModal from './batteryModal'
import measurementModal from './measurementModal'

export default {
  components: {
    batteryModal,
    measurementModal
  },
  data () {
    return {
      loading: true
    }
  },
  computed: {
    ...mapState('modules/firebase', ['batteries']),
    sortedBatteries () {
      return [...this.batteries].sort((a, b) => a.latestVoltage - b.latestVoltage)
    }
  },
  created () {
    // Extend dayjs
    this.$dayjs.extend(advancedFormat)

    return this.bindBatteries()
      .then(resp => (this.loading = false))
      .catch((err) => {
        this.loading = false
        // eslint-disable-next-line
        console.error(err)
      })
  },
  beforeDestroy () {
    this.unbindBatteries()
  },
  methods: {
    ...mapActions('modules/firebase', ['bindBatteries', 'unbindBatteries']),
    ...mapMutations('modules/batteries', ['toggleBatteryModal', 'selectBattery']),
    calcBatteryCharge: utils.calcBatteryCharge,
    setChargeColor: utils.setChargeColor,
    setNotificationStatus (battery, position) {
      if (position === 'first' && battery.notificationsSent.first) {
        return 'first-notification-sent'
      } else if (position === 'second' && battery.notificationsSent.second) {
        return 'second-notification-sent'
      }
    },
    cardClick (battery) {
      if (battery.id) {
        this.selectBattery(battery)
        this.toggleBatteryModal('edit')
      } else {
        this.toggleBatteryModal('add')
      }
    },
    formatTime (timestamp) {
      return this.$dayjs(timestamp.seconds * 1000).format('MMMM Do, YYYY - HH:mm')
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
  .wrap {
    margin-bottom: 60px;
  }
  @media (max-width: 1903px) {
    .wrap {
      justify-content: center;
    }
  }

  .single-battery-card:hover {
    opacity: 0.8;
  }

  .battery-charge {
    font-size: 2em;
    font-weight: bold;
  }

  .latest-voltage {
    font-size: 1.3em;
    font-weight: bold;
    margin-top: -8px;
    opacity: 0.8;
  }

  .v-card__title {
    font-size: 1.05rem;
  }

  .card-main-content {
    text-align: left;
  }

  .last-seen {
    margin-top: -3px;
  }

  .add-new-card {
    min-height: 105px; /* Height of a battery card */
    display: flex !important;
    justify-content: center;
    align-items: center;
    opacity: 0.3;
  }
  .add-new-card:hover {
    opacity: 0.5;
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
  
  .v-bottom-navigation button {
    height: 100% !important;
  }
</style>
