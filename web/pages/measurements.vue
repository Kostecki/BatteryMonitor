<template>
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
    <template v-slot:[`item.name`]="{ item }">
      <span :class="idToName(item.batteryId) === 'Battery not found' ? 'not-found' : null">{{ idToName(item.batteryId) }}</span>
    </template>
    <template v-slot:[`item.createdAt`]="{ item }">
      <span>{{ $dayjs(item.createdAt.seconds * 1000).format('MMMM Do, YYYY - HH:mm') }}</span>
    </template>
  </v-data-table>
</template>

<script>
import advancedFormat from 'dayjs/plugin/advancedFormat'
import { mapState, mapActions } from 'vuex'

export default {
  data () {
    return {
      loading: true,
      headers: [
        {
          text: 'Battery ID',
          align: 'start',
          sortable: true,
          value: 'batteryId'
        },
        {
          text: 'Battery Name',
          align: 'start',
          sortable: true,
          value: 'name'
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
    ...mapActions('modules/firebase', ['bindMeasurements', 'unbindMeasurements']),
    ...mapActions('modules/firebase', ['bindBatteries', 'unbindBatteries']),
    idToName (batteryId) {
      const battery = this.batteries.find(e => e.id === batteryId)
      return battery ? battery.name : 'Battery not found'
    }
  }
}
</script>

<style>
  .measurements-table {
    margin-bottom: 100px;
  }

  .not-found {
    font-style: italic;
  }
</style>
