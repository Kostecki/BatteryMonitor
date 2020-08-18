<template>
  <v-dialog
    v-model="measurementModalVisible"
    :retain-focus="false"
    persistent
    max-width="380"
  >
    <v-card>
      <v-card-title
        class="headline"
      >
        New Measurement
      </v-card-title>
      <v-form
        ref="form"
        v-model="valid"
        class="px-6"
      >
        <v-select
          v-model="modalValues.batteryId.value"
          :items="batteries"
          item-text="name"
          item-value="id"
          label="Battery"
          dense
          class="batteries-select"
          required
        />
        <v-text-field
          v-model.number="modalValues.voltage.value"
          label="Voltage"
          type="number"
          step="0.1"
          suffix="Volt"
          required
        />
      </v-form>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="red darken-1"
          text
          @click="dismissDialog"
        >
          Cancel
        </v-btn>
        <v-btn
          color="blue darken-1"
          text
          :disabled="!valid"
          @click="saveMeasurement"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

export default {
  data () {
    return {
      valid: false,
      modalValues: {
        batteryId: {
          value: null,
          rules: [v => !!v || 'Battery ID is required']
        },
        voltage: {
          value: null,
          rules: [v => !!v || 'Voltage is required']
        }
      }
    }
  },
  computed: {
    ...mapState('modules/measurements', ['measurementModalVisible']),
    ...mapState('modules/firebase', ['batteries'])
  },
  methods: {
    ...mapMutations('modules/measurements', ['toggleMeasurementModal']),
    ...mapMutations('modules/statusAlert', ['toggleAlert']),
    dismissDialog () {
      this.$refs.form.reset()
      this.toggleMeasurementModal()
    },
    saveMeasurement () {
      const payload = {}
      Object.keys(this.modalValues).forEach((key) => {
        payload[key] = this.modalValues[key].value
      })

      // POST new measurement
      this.$axios.$post('/api/measurement', payload)
        .then(() => this.toggleAlert({
          showAlert: true,
          alertType: 'success',
          alertMessage: 'Measurement successfully added'
        }))
        .catch(err => this.toggleAlert({
          showAlert: true,
          alertType: 'error',
          alertMessage: `Something went wrong creating measurement: ${err}`
        }))

      this.$refs.form.reset()
      this.toggleMeasurementModal()
    }
  }
}
</script>

<style>
  .batteries-select {
    margin-top: 15px;
  }
</style>
