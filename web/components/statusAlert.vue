<template>
  <v-alert
    :value="showAlert"
    :type="alertType"
    border="bottom"
    dismissible
    transition="fade-transition"
  >
    {{ alertMessage }}
  </v-alert>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

export default {
  computed: {
    ...mapState('modules/statusAlert', ['showAlert', 'alertType', 'alertMessage', 'alertTimeout'])
  },
  watch: {
    showAlert (val) {
      if (val) {
        setTimeout(() => {
          this.toggleAlert({ showAlert: false })
        }, this.alertTimeout || 3000)
      }
    }
  },
  methods: {
    ...mapMutations('modules/statusAlert', ['toggleAlert'])
  }
}
</script>

<style>

</style>
