<template>
  <v-dialog v-model="batteryModalVisible" persistent max-width="380">
    <v-card>
      <v-card-title
        class="headline"
      >
        {{ modalState.title }}
      </v-card-title>
      <v-form
        ref="form"
        v-model="valid"
        class="px-6"
      >
        <v-text-field
          v-model="modalValues.name.value"
          :rules="modalValues.name.rules"
          label="Name"
          required
        />
        <v-text-field
          v-model="modalValues.manufacturer.value"
          :rules="modalValues.manufacturer.rules"
          label="Manufacturer"
          required
        />
        <v-text-field
          v-model="modalValues.model.value"
          :rules="modalValues.model.rules"
          label="Model"
          required
        />
        <v-text-field
          v-model.number="modalValues.capacity.value"
          :rules="modalValues.capacity.rules"
          label="Capacity"
          type="number"
          suffix="Ah"
          required
        />
        <v-text-field
          v-model.number="modalValues.latestVoltage.value"
          label="Latest Voltage"
          type="number"
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
          @click="saveBattery"
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
        name: {
          value: '',
          rules: [v => !!v || 'Name is required']
        },
        manufacturer: {
          value: '',
          rules: [v => !!v || 'Manufacturer is required']
        },
        model: {
          value: '',
          rules: [v => !!v || 'Model is required']
        },
        capacity: {
          value: null,
          rules: [v => !!v || 'Capacity is required']
        },
        latestVoltage: {
          value: null
        }
      }
    }
  },
  computed: {
    ...mapState('modules/batteries', ['batteryModalVisible', 'modalState', 'selectedBattery'])
  },
  watch: {
    batteryModalVisible (val) {
      if (val && this.selectedBattery) {
        this.modalValues.name.value = this.selectedBattery.name
        this.modalValues.manufacturer.value = this.selectedBattery.manufacturer
        this.modalValues.model.value = this.selectedBattery.model
        this.modalValues.capacity.value = this.selectedBattery.capacity
        this.modalValues.latestVoltage.value = this.selectedBattery.latestVoltage
      }
    }
  },
  methods: {
    ...mapMutations('modules/batteries', ['toggleBatteryModal', 'deselectBattery']),
    dismissDialog () {
      this.$refs.form.reset()
      this.deselectBattery()
      this.toggleBatteryModal()
    },
    saveBattery () {
      const payload = {}
      Object.keys(this.modalValues).forEach((key) => {
        payload[key] = this.modalValues[key].value
      })

      // eslint-disable-next-line
      console.log(payload)

      switch (this.modalState.mode) {
        case 'add':
          // POST new payload
          break

        case 'edit':
          // PUT edited payload
          break

        default:
          break
      }

      this.$refs.form.reset()
      this.deselectBattery()
      this.toggleBatteryModal()
    }
  }
}
</script>

<style>
</style>
