<template>
  <v-app id="main" :style="{background: $vuetify.theme.themes['light'].background}">
    <v-main>
      <v-container>
        <nuxt />
        <v-bottom-navigation
          grow
          fixed
          color="orange"
          height="70"
          :value="activeTab"
        >
          <v-btn to="/">
            <span>Batteries</span>
            <v-icon>mdi-battery-high</v-icon>
          </v-btn>

          <v-btn v-if="loggedIn" @click="newBattery">
            <span>New Battery</span>
            <v-icon>mdi-battery-positive</v-icon>
          </v-btn>

          <v-btn v-if="loggedIn" @click="toggleMeasurementModal">
            <span>New Measurement</span>
            <v-icon>mdi-chart-box-plus-outline</v-icon>
          </v-btn>

          <v-btn to="/measurements">
            <span>Measurements</span>
            <v-icon>mdi-chart-box-outline</v-icon>
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
  data () {
    return {
      activeTab: 0
    }
  },
  computed: {
    ...mapState(['loggedIn'])
  },
  created () {
    this.setActiveTab()
  },
  methods: {
    ...mapMutations('modules/batteries', ['toggleBatteryModal', 'toggleMeasurementModal']),
    setActiveTab () {
      switch (this.$nuxt.$route.name) {
        case 'index':
          this.activeTab = 0
          break
        case 'measurements':
          this.activeTab = 3
          break

        default:
          break
      }
    },
    newBattery () {
      this.toggleBatteryModal('add')
    }
  }
}
</script>

<style>
  .v-bottom-navigation button,
  .v-bottom-navigation a {
    height: 100%;
  }
</style>
