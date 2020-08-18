<template>
  <div>
    <v-data-table
      :loading="loading"
      :headers="headers"
      :items="measurements"
      :items-per-page="50"
      :footer-props="{
        'items-per-page-options': [50, 100, 150, 200, -1]
      }"
      dense
      class="measurements-table elevation-1"
    >
      <template v-slot:[`item.batteryId`]="{ item }">
        <span>{{ idToName(item.batteryId) ? idToName(item.batteryId) : item.batteryId }}</span>
        <span class="batt-id-has-name">{{ idToName(item.batteryId) ? `(${item.batteryId})` : null }}</span>
      </template>
      <template v-slot:[`item.voltage`]="{ item }">
        <span>{{ item.voltage.toFixed(2) }}</span>
      </template>
      <template v-slot:[`item.createdAt`]="{ item }">
        <span>{{ $dayjs(item.createdAt.seconds * 1000).format('MMMM Do, YYYY HH:mm') }}</span>
      </template>
    </v-data-table>

    <measurementModal />
  </div>
</template>

<script>
import advancedFormat from 'dayjs/plugin/advancedFormat'
import { mapState, mapActions } from 'vuex'
import measurementModal from '../components/measurementModal'

export default {
  components: {
    measurementModal
  },
  data () {
    return {
      loading: true,
      headers: [
        {
          text: 'Battery',
          align: 'start',
          sortable: true,
          value: 'batteryId'
        },
        {
          text: 'Voltage',
          align: 'start',
          sortable: false,
          value: 'voltage'
        },
        {
          text: 'Created',
          align: 'start',
          sortable: true,
          value: 'createdAt'
        }
      ]
    }
  },
  computed: {
    ...mapState('modules/firebase', ['batteries', 'measurements'])
  },
  created () {
    // Extend dayjs
    this.$dayjs.extend(advancedFormat)

    this.bindMeasurements()
      .then(resp => (this.loading = false))
      .catch((err) => {
        this.loading = false
        // eslint-disable-next-line
        console.error(err)
      })

    this.bindBatteries()
      .then(resp => (this.loading = false))
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
    ...mapActions('modules/firebase', ['bindBatteries', 'unbindBatteries', 'bindMeasurements', 'unbindMeasurements']),
    idToName (batteryId) {
      const battery = this.batteries.find(e => e.id === batteryId)
      return battery ? battery.name : null
    }
  }
}
</script>

<style>
  .measurements-table {
    margin-bottom: 100px;
  }

  .batt-id-has-name {
    font-style: italic;
    opacity: 0.5;
  }
</style>
