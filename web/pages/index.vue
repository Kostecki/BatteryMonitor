<template>
  <v-row>
    <v-col cols="12" class="card-container">
      <v-data-table
        v-model="selectedRow"
        :loading="batteriesLoading"
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
          {{ calcBatteryCharge(item.latestVoltage) }} %
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
    </v-col>
    <v-col cols="12" class="chart-wrapper">
      <div v-if="!batteriesLoading" class="chart-container elevation-1">
        <div v-if="selectedRow.length < 1" class="empty-table">
          Choose a battery to view the graphed voltage measurements
        </div>
        <lineChart :chart-data="datacollection" :options="lineChartOptions" class="chart" />
      </div>
    </v-col>
    <batteryModal />
  </v-row>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex'

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
      headers: [
        { text: 'Charge', value: 'charge' },
        { text: 'Name', value: 'name' },
        { text: 'ID', value: 'id' },
        { text: 'Manufacturer', value: 'manufacturer' },
        { text: 'Model', value: 'model' },
        { text: 'Capacity (Ah)', value: 'capacity' },
        { text: 'Voltage (V)', value: 'latestVoltage' },
        { text: 'Last Seen', value: 'lastSeen' },
        {
          text: 'Voltage Divider Ratio',
          value: 'voltageDividerRatio',
          sortable: false,
          align: 'center'
        },
        {
          text: 'Nofitications',
          value: 'notifications',
          sortable: false,
          align: 'center',
          class: 'nofitications-row'
        },
        {
          text: 'Edit',
          value: 'edit',
          sortable: false,
          align: 'center'
        }
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
    ...mapState('modules/auth', ['authenticated']),
    ...mapState('modules/batteries', {
      batteriesLoading: 'loading',
      batteries: 'batteries'
    }),
    ...mapState('modules/measurements', {
      measurementsLoading: 'loading',
      measurements: 'measurements'
    }),
    sortedBatteries () {
      return [...this.batteries].sort((a, b) => a.latestVoltage - b.latestVoltage)
    }
  },
  watch: {
    batteries (newRow, oldRow) {
      if (newRow) {
        const formattedData = []

        this.batteries.forEach((batt) => {
          const {
            name,
            id,
            manufacturer,
            model,
            capacity,
            latestVoltage,
            lastSeen,
            notificationsSent,
            voltageDividerRatio
          } = batt

          formattedData.push({
            name,
            id,
            manufacturer,
            model,
            capacity,
            latestVoltage,
            charge: this.calcBatteryCharge(latestVoltage),
            lastSeen,
            notifications: notificationsSent,
            voltageDividerRatio
          })

          this.tableItems = formattedData
        })
      }
    },
    selectedRow (rowNew, rowOld) {
      const row = rowNew[0]
      if (row && row.name) {
        const labels = []
        const data = []

        this.getMeasurements(row.id)
          .then((resp) => {
            resp.forEach((m) => {
              const date = this.$dayjs(m.createdAt).format('DD-MM-YYYY HH:mm')
              labels.push(date)
              data.push(m.voltage)
            })

            this.fillData(labels, data)
          })
      } else {
        this.fillData([''], [])
      }
    }
  },
  created () {
    this.getBatteries()
  },
  methods: {
    ...mapMutations('modules/modals', ['selectBattery', 'toggleBatteryModal']),
    ...mapActions('modules/batteries', ['getBatteries']),
    ...mapActions('modules/measurements', ['getMeasurements']),
    ...mapActions('modules/firebase', ['bindBatteries', 'unbindBatteries', 'bindMeasurements', 'unbindMeasurements']),
    calcBatteryCharge: utils.calcBatteryCharge,
    setChargeColor: utils.setChargeColor,
    itemRowBackground (item) {
      const charge = item.latestVoltage

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
      return this.$dayjs(timestamp).format('DD-MM-YYYY - HH:mm')
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
