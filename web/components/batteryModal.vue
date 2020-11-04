<template>
  <v-dialog
    v-model="batteryModal.visible"
    :retain-focus="false"
    persistent
    max-width="380"
  >
    <v-card>
      <v-card-title class="headline">
        <div>
          {{ batteryModal.title }}
        </div>
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
        <v-text-field
          v-model.number="modalValues.voltageDividerRatio.value"
          label="Voltage Divider Ratio"
          type="number"
          step="0.01"
        />
      </v-form>
      <v-card-actions>
        <v-btn
          v-if="selectedBattery && selectedBattery.id"
          color="red darken-1"
          text
          class="ml-2"
          @click="removeBattery"
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
          @click="saveBattery"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex'

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
        },
        voltageDividerRatio: {
          value: null
        }
      }
    }
  },
  computed: {
    ...mapState('modules/modals', ['batteryModal', 'selectedBattery']),
    modalVisible () {
      return this.batteryModal.visible
    }
  },
  watch: {
    modalVisible (val) {
      if (val && this.selectedBattery) {
        this.modalValues.name.value = this.selectedBattery.name
        this.modalValues.manufacturer.value = this.selectedBattery.manufacturer
        this.modalValues.model.value = this.selectedBattery.model
        this.modalValues.capacity.value = this.selectedBattery.capacity
        this.modalValues.latestVoltage.value = this.selectedBattery.latestVoltage
        this.modalValues.voltageDividerRatio.value = this.selectedBattery.voltageDividerRatio
      }
    }
  },
  methods: {
    ...mapMutations('modules/modals', ['toggleBatteryModal', 'deselectBattery']),
    ...mapMutations('modules/shared', ['toggleAlert']),
    ...mapActions('modules/batteries', ['addBattery', 'editBattery', 'deleteBattery']),
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

      switch (this.batteryModal.mode) {
        case 'add':
          this.addBattery(payload)
            .then(() => {
              this.dismissDialog()
              this.toggleAlert({
                visible: true,
                type: 'success',
                message: 'New battery successfully created'
              })
            }) // Message
            .catch((error) => {
              this.toggleAlert({
                visible: true,
                type: 'error',
                message: `Something went wrong creating battery: ${error}`
              })
            })
          break

        case 'edit':
          // Add battery id to payload to edit the right battery
          payload.id = this.selectedBattery.id
          this.editBattery(payload)
            .then(() => {
              this.dismissDialog()
              this.toggleAlert({
                visible: true,
                type: 'success',
                message: 'Battery successfully updated'
              })
            })
            .catch((error) => {
              this.toggleAlert({
                visible: true,
                type: 'error',
                message: `Something went wrong updating battery: ${error}`
              })
            })
          break

        default:
          break
      }
    },
    removeBattery () {
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
          this.deleteBattery(this.selectedBattery.id)
            .then(() => {
              this.dismissDialog()
              this.toggleAlert({
                visible: true,
                type: 'success',
                message: 'Battery successfully deleted'
              })
            })
            .catch((error) => {
              this.toggleAlert({
                visible: true,
                type: 'error',
                message: `Something went wrong deleting battery: ${error}`
              })
            })
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

  .modal-title i:hover {
    opacity: 0.7;
    cursor: pointer;
  }

  .battery-id {
    color: rgba(128, 128, 128, 0.6);
    font-size: 14px;
    margin-top: -7px;
    font-style: italic;
  }
</style>
