<template>
  <v-dialog
    v-model="batteryModalVisible"
    :retain-focus="false"
    persistent
    max-width="380"
  >
    <v-card>
      <v-card-title class="headline">
        <div>{{ modalState.title }}</div>
        <div
          v-if="selectedBattery && selectedBattery.id"
          class="battery-id"
        >
          ID: {{ selectedBattery.id }}
        </div>
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
          step="0.1"
          suffix="Volt"
          required
        />
      </v-form>
      <v-card-actions>
        <v-btn
          v-if="selectedBattery && selectedBattery.id"
          color="red darken-1"
          text
          class="ml-2"
          @click="deleteBattery"
        >
          Delete
        </v-btn>
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
    ...mapMutations('modules/statusAlert', ['toggleAlert']),
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

      switch (this.modalState.mode) {
        case 'add':
          this.$axios.$post('/api/battery', payload)
            .then(() => this.toggleAlert({
              showAlert: true,
              alertType: 'success',
              alertMessage: 'New battery successfully created'
            }))
            .catch(err => this.toggleAlert({
              showAlert: true,
              alertType: 'error',
              alertMessage: `Something went wrong creating battery: ${err}`
            }))
          break

        case 'edit':
          // Add battery id to payload to edit the right battery
          payload.id = this.selectedBattery.id
          this.$axios.$put('/api/battery', payload)
            .then(() => this.toggleAlert({
              showAlert: true,
              alertType: 'success',
              alertMessage: 'Battery successfully updated'
            }))
            .catch(err => this.toggleAlert({
              showAlert: true,
              alertType: 'error',
              alertMessage: `Something went wrong updating battery: ${err}`
            }))
          break

        default:
          break
      }
      this.dismissDialog()
    },
    deleteBattery () {
      this.$swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      }).then((result) => {
        if (result.value) {
          this.$axios.$delete(`/api/battery/${this.selectedBattery.id}`)
            .then(() => {
              this.toggleAlert({
                showAlert: true,
                alertType: 'success',
                alertMessage: 'Battery successfully deleted'
              })

              this.dismissDialog()
            })
            .catch(err => this.toggleAlert({
              showAlert: true,
              alertType: 'error',
              alertMessage: `Something went wrong deleting battery: ${err}`
            }))
        }
      })
    }
  }
}
</script>

<style>
  .headline {
    display: flex !important;
    align-items: flex-start !important;
    flex-direction: column;
  }

  .battery-id {
    color: rgba(128, 128, 128, 0.6);
    font-size: 14px;
    margin-top: -7px;
    font-style: italic;
  }
</style>
