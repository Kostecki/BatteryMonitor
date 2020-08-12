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
          <v-btn v-if="loggedIn" @click="newBattery">
            <span>New Battery</span>
            <v-icon>mdi-battery-outline</v-icon>
          </v-btn>

          <v-btn v-if="loggedIn" @click="toggleMeasurementModal">
            <span>New Measurement</span>
            <v-icon>mdi-chart-box-plus-outline</v-icon>
          </v-btn>

          <v-btn v-if="!loggedIn">
            <span>Log in</span>
            <v-icon>mdi-lock-open-outline</v-icon>
          </v-btn>
        </v-bottom-navigation>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

export default {
  computed: {
    ...mapState(['loggedIn'])
  },
  methods: {
    ...mapMutations('modules/batteries', ['toggleBatteryModal', 'toggleMeasurementModal']),
    newBattery () {
      this.toggleBatteryModal('add')
    }
  }
}
</script>
