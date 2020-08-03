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
          <v-col cols="3" class="d-flex battery-percentage" :style="{color: setChargeColor(battery.latestVoltage) }">
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
              <div>{{ `Voltage: ${battery.latestVoltage} Volt` }}</div>
            </v-card-subtitle>
          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import utils from '../utils/helperFunctions'

export default {
  components: {},
  data () {
    return {
      batteries: [
        {
          manufacturer: 'Sonnenschein',
          createdAt: {
            _seconds: 1591739962,
            _nanoseconds: 779000000
          },
          capacity: 120,
          model: 'GF 12 105 V',
          notificationsSent: {
            second: false,
            first: false
          },
          latestVoltage: 12.3,
          name: 'Cloud Raven',
          updatedAt: {
            _seconds: 1591739962,
            _nanoseconds: 779000000
          }
        },
        {
          manufacturer: 'Sonnenschein',
          createdAt: {
            _seconds: 1591740044,
            _nanoseconds: 696000000
          },
          capacity: 75,
          model: 'GF 12 65 Y',
          notificationsSent: {
            second: false,
            first: false
          },
          latestVoltage: 12.6,
          name: 'Electric Chicken',
          updatedAt: {
            _seconds: 1591740044,
            _nanoseconds: 696000000
          }
        },
        {
          notificationsSent: {
            second: false,
            first: false
          },
          model: 'Heavy Duty Extra II',
          latestVoltage: 12,
          name: 'Lightning Goose',
          updatedAt: {
            _seconds: 1591739853,
            _nanoseconds: 539000000
          },
          manufacturer: 'Volvo',
          createdAt: {
            _seconds: 1591739853,
            _nanoseconds: 539000000
          },
          capacity: 225
        },
        {
          manufacturer: 'Tianneng',
          createdAt: {
            _seconds: 1592094072,
            _nanoseconds: 422000000
          },
          capacity: 20,
          notificationsSent: {
            first: false,
            second: false
          },
          model: '6-DZM-20',
          latestVoltage: 12.8,
          name: 'Energy Magpie',
          updatedAt: {
            _seconds: 1592094072,
            _nanoseconds: 422000000
          }
        },
        {
          manufacturer: 'Varta',
          createdAt: {
            _seconds: 1591740021,
            _nanoseconds: 369000000
          },
          capacity: 230,
          model: 'LFD230',
          notificationsSent: {
            first: false,
            second: false
          },
          latestVoltage: 12.5,
          name: 'Power Pelican',
          updatedAt: {
            _seconds: 1591740021,
            _nanoseconds: 369000000
          }
        },
        {
          updatedAt: {
            _seconds: 1592297693,
            _nanoseconds: 236000000
          },
          manufacturer: 'Sonnenschein',
          createdAt: {
            _seconds: 1591740086,
            _nanoseconds: 386000000
          },
          capacity: 75,
          notificationsSent: {
            second: false,
            first: false
          },
          model: 'GF 12 65 Y',
          latestVoltage: 12.7,
          name: 'Charge Dove'
        },
        {
          model: 'Heavy Duty Extra II',
          notificationsSent: {
            first: false,
            second: false
          },
          latestVoltage: 12.4,
          name: 'Current Swallow',
          updatedAt: {
            _seconds: 1591739981,
            _nanoseconds: 800000000
          },
          manufacturer: 'Volvo',
          createdAt: {
            _seconds: 1591739981,
            _nanoseconds: 800000000
          },
          capacity: 225
        },
        {
          createdAt: {
            _seconds: 1591739892,
            _nanoseconds: 390000000
          },
          capacity: 140,
          model: 'K10',
          notificationsSent: {
            second: false,
            first: false
          },
          latestVoltage: 12.1,
          name: 'Storm Gobbler',
          updatedAt: {
            _seconds: 1591739892,
            _nanoseconds: 390000000
          },
          manufacturer: 'Varta'
        },
        {
          manufacturer: 'Powerfit',
          createdAt: {
            _seconds: 1591739939,
            _nanoseconds: 831000000
          },
          capacity: 7.2,
          model: 'S312/7 S',
          notificationsSent: {
            second: false,
            first: false
          },
          latestVoltage: 12.2,
          name: 'Thunder Duck',
          updatedAt: {
            _seconds: 1591739939,
            _nanoseconds: 831000000
          }
        }
      ]
    }
  },
  computed: {
    sortedBatteries () {
      const batteries = this.batteries
      return batteries.sort((a, b) => a.latestVoltage - b.latestVoltage)
    }
  },
  methods: {
    calcBatteryCharge: utils.calcBatteryCharge,
    setChargeColor: utils.setChargeColor
  }
}
</script>

<style>
  .card-main-content {
    text-align: left;
  }
</style>
