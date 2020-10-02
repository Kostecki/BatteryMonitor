<template>
  <v-row>
    <v-col cols="12" class="card-container">
      <client-only>
        <v-data-table
          v-model="selectedRow"
          :loading="loading"
          dense
          :headers="headers"
          :items="tableItems"
          :single-select="true"
          show-select
          :item-class="itemRowBackground"
          :footer-props="{
            'items-per-page-options': [10, 20, -1]
          }"
          :items-per-page="20"
          class="elevation-1"
        >
          <template v-slot:[`item.charge`]="{ item }">
            {{ item.charge }} %
          </template>
          <template v-slot:[`item.latestVoltage`]="{ item }">
            {{ item.latestVoltage.toFixed(2) }}
          </template>
          <template v-slot:[`item.lastSeen`]="{ item }">
            {{ formatTime(item.lastSeen) }}
          </template>
          <template v-slot:[`item.notifications`]="{ item }">
            <div class="notifications-wrapper">
              <v-simple-checkbox
                :value="item.notifications.first"
                color="yellow"
                :ripple="false"
                class="notification-checkbox"
              />
              <v-simple-checkbox
                :value="item.notifications.second"
                color="red"
                :ripple="false"
                class="notification-checkbox"
              />
            </div>
          </template>
          <template v-slot:[`item.edit`]="{ item }">
            <v-icon
              small
              @click="editItem(item)"
            >
              mdi-pencil
            </v-icon>
          </template>
        </v-data-table>
      </client-only>
    </v-col>
    <v-col cols="12" class="chart-wrapper">
      <div v-if="!loading" class="chart-container elevation-1">
        <div v-if="selectedRow.length < 1" class="empty-table">
          Choose a battery to view the graphed voltage measurements
        </div>
        <lineChart :chart-data="datacollection" :options="lineChartOptions" class="chart" />
      </div>
    </v-col>
    <button @click="signOut">log out</button>
    <batteryModal />
  </v-row>
</template>

<script>
import advancedFormat from 'dayjs/plugin/advancedFormat'
import { mapActions, mapState, mapMutations, mapGetters } from 'vuex'
import utils from '../utils/helperFunctions'
import batteryModal from '../components/batteryModal'
import lineChart from '../components/lineChart'

export default {
  components: {
    batteryModal,
    lineChart
  },
  data () {
    return {
      loading: true,
      headers: [
        { text: 'Charge', value: 'charge' },
        { text: 'Name', value: 'name' },
        { text: 'ID', value: 'id' },
        { text: 'Manufacturer', value: 'manufacturer' },
        { text: 'Model', value: 'model' },
        { text: 'Capacity (Ah)', value: 'capacity' },
        { text: 'Voltage (V)', value: 'latestVoltage' },
        { text: 'Last Seen', value: 'lastSeen' },
        { text: 'Nofitications', value: 'notifications', align: 'center', class: 'nofitications-row' },
        { text: 'Edit', value: 'edit', sortable: false, align: 'center' }
      ],
      tableItems: [],
      selectedRow: [],
      datacollection: {
        labels: [''],
        datasets: []
      },
      lineChartOptions: {
        maintainAspectRatio: false,
        legend: {
          display: false
        },
        tooltips: {
          backgroundColor: '#17BF62'
        },
        scales: {
          xAxes: [
            {}
          ],
          yAxes: [
            {
              ticks: {
                userCallback (item) {
                  return `${item.toFixed(2)} V`
                },
                suggestedMin: 10,
                suggestedMax: 14
              }
            }
          ]
        }
      }
    }
  },
  computed: {
    ...mapGetters('modules/user', ['isAuthenticated']),
    ...mapState('modules/firebase', ['batteries']),
    sortedBatteries () {
      return [...this.batteries].sort((a, b) => a.latestVoltage - b.latestVoltage)
    }
  },
  watch: {
    selectedRow (rowNew, rowOld) {
      if (rowNew[0] && rowNew[0].name) {
        this.bindMeasurements(rowNew[0].id)
          .then((resp) => {
            const labels = []
            const data = []

            resp.forEach((m) => {
              const date = this.$dayjs(m.createdAt.seconds * 1000).format('DD-MM-YYYY HH:mm')
              labels.push(date)
              data.push(m.voltage)
            })

            this.fillData(labels, data)
          })
          .catch((err) => {
            this.loading = false
            // eslint-disable-next-line
          console.error(err)
          })
      } else {
        this.fillData([''], [])
      }
    }
  },
  created () {
    // Extend dayjs
    this.$dayjs.extend(advancedFormat)

    this.signIn({
      email: 'kostecki.jacob@gmail.com',
      password: 'met75afx'
    })

    console.log(this.isAuthenticated)

    this.bindBatteries()
      .then((resp) => {
        resp.forEach((battery) => {
          this.tableItems.push({
            name: battery.name,
            id: battery.id,
            manufacturer: battery.manufacturer,
            model: battery.model,
            capacity: battery.capacity,
            latestVoltage: battery.latestVoltage,
            charge: this.calcBatteryCharge(battery.latestVoltage),
            lastSeen: battery.lastSeen,
            notifications: battery.notificationsSent
          })
        })

        this.loading = false
      })
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
    ...mapActions('modules/user', ['signIn', 'signOut']),
    ...mapActions('modules/firebase', ['bindBatteries', 'unbindBatteries', 'bindMeasurements', 'unbindMeasurements']),
    ...mapMutations('modules/batteries', ['toggleBatteryModal', 'selectBattery']),
    calcBatteryCharge: utils.calcBatteryCharge,
    setChargeColor: utils.setChargeColor,
    itemRowBackground (item) {
      const charge = this.calcBatteryCharge(item)

      if (charge >= 12.24) {
        return 'battery-danger'
      } else if (charge > 11.66) {
        return 'battery-warning'
      } else {
        return 'battery-good'
      }
    },
    fillData (labels, data) {
      this.datacollection = {
        labels,
        datasets: [
          {
            label: 'Voltage',
            backgroundColor: '#003f5c',
            fill: false,
            data
          }
        ]
      }
    },
    editItem (item) {
      const battery = this.batteries.find(e => e.id === item.id)
      this.selectBattery(battery)
      this.toggleBatteryModal('edit')
    },
    getBatteryFromId (batteryId) {
      return this.batteries.find(battery => battery.id === batteryId).name
    },
    formatTime (timestamp) {
      if (!timestamp) { return }
      return this.$dayjs(timestamp.seconds * 1000).format('DD-MM-YYYY, HH:mm')
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

  .chart-wrapper {
    padding: 0;
  }

  .chart-container {
    position: relative;
    background: white;
    border-radius: 4px;
    margin: 0 12px 0 12px;
    padding: 24px 12px;
  }

  .empty-table {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    border-radius: 4px;
    color: white;
    background: rgba(0, 0, 0, 0.8);
    opacity: 0.3;
    font-style: italic;
  }

  .battery-danger td { border-color: #F44336; /* Vuetify base red*/ }
  .battery-warning td { border-color: #FFD600; /* Vuetify yellow accent 4*/ }
  .battery-good td { border-color: #4CAF50; /* Vuetify base green*/ }

  tbody tr .text-start:first-of-type {
    border-width: 8px;
    border-left-style: solid;
    padding-left: 8px;
    margin-top: 2px;
  }

  .notifications-wrapper {
    display: flex;
    justify-content: space-evenly;
  }

  .notification-checkbox {
    margin: 0;
    cursor: default;
  }
</style>
