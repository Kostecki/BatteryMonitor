<template>
  <v-app id="main" :style="{background: $vuetify.theme.themes['light'].background}">
    <v-main>
      <v-container>
        <nuxt />
        <v-bottom-navigation
          grow
          fixed
          color="orange"
        >
          <v-btn @click="newBattery">
            <span>New Battery</span>
            <v-icon>mdi-battery-outline</v-icon>
          </v-btn>

          <v-btn @click="toggleMeasurementModal">
            <span>New Measurement</span>
            <v-icon>mdi-chart-box-plus-outline</v-icon>
          </v-btn>

          <v-btn>
            <span>Log in</span>
            <v-icon>mdi-lock-open-outline</v-icon>
          </v-btn>
        </v-bottom-navigation>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { mapMutations } from 'vuex'

export default {
  methods: {
    ...mapMutations('modules/batteries', ['toggleBatteryModal', 'toggleMeasurementModal']),
    newBattery () {
      this.toggleBatteryModal('add')
    }
  }
}
</script>
