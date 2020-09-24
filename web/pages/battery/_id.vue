<template>
  <v-row class="wrapper">
    <lineChart :chart-data="datacollection" :options="lineChartOptions" class="chart" />
  </v-row>
</template>

<script>
import { mapActions, mapState } from 'vuex'

import lineChart from '../../components/lineChart'

export default {
  components: {
    lineChart
  },
  data () {
    return {
      batteryId: this.$route.params.id,
      loading: true,
      datacollection: {
        labels: [''],
        datasets: []
      },
      lineChartOptions: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: '',
          fontSize: 24,
          fontColor: '#6b7280'
        },
        tooltips: {
          backgroundColor: '#17BF62'
        },
        scales: {
          xAxes: [
            {
              gridLines: {
                display: false
              },
              ticks: {
                display: false
              }
            }
          ],
          yAxes: [
            {
              ticks: {
                userCallback (item) {
                  return `${item.toFixed(2)} V`
                }
              },
              gridLines: {
                display: false
              }
            }
          ]
        }
      }
    }
  },
  computed: {
    ...mapState('modules/firebase', ['batteries'])
  },
  mounted () {
    this.bindMeasurements(this.batteryId)
      .then((resp) => {
        const labels = []
        const data = []

        resp.forEach((m) => {
          const date = this.$dayjs(m.createdAt.seconds * 1000).format('DD-MM-YYYY HH:mm')
          labels.push(date)
          data.push(m.voltage)
        })

        this.fillData(labels, data)

        this.lineChartOptions.title.text = this.getBatteryFromId(this.batteryId)
      })
      .catch((err) => {
        this.loading = false
        // eslint-disable-next-line
        console.error(err)
      })
  },
  beforeDestroy () {
    this.unbindMeasurements()
  },
  methods: {
    ...mapActions('modules/firebase', ['bindMeasurements', 'unbindMeasurements']),
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

      this.loading = false
    },
    getBatteryFromId (batteryId) {
      return this.batteries.find(battery => battery.id === batteryId).name
    }
  }
}
</script>

<style scoped>
  .wrapper {
    justify-content: center;
  }

  .chart {
    width: 90%;
  }
</style>
