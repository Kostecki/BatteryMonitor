<template>
  <v-app id="main" :style="{background: $vuetify.theme.themes['light'].background}">
    <v-main>
      <!-- Status Alert -->
      <statusAlert />

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
          <v-divider vertical />

          <v-btn v-if="loggedIn && this.$nuxt.$route.name === 'index'" @click="newBattery">
            <span>New Battery</span>
            <v-icon>mdi-battery-positive</v-icon>
          </v-btn>
          <v-divider v-if="loggedIn && this.$nuxt.$route.name === 'index'" vertical />

          <v-btn v-if="loggedIn && this.$nuxt.$route.name === 'measurements'" @click="toggleMeasurementModal">
            <span>New Measurement</span>
            <v-icon>mdi-chart-box-plus-outline</v-icon>
          </v-btn>
          <v-divider v-if="loggedIn && this.$nuxt.$route.name === 'measurements'" vertical />

          <v-btn to="/measurements">
            <span>Measurements</span>
            <v-icon>mdi-chart-box-outline</v-icon>
          </v-btn>
          <v-divider v-if="!loggedIn" vertical />

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
import statusAlert from '../components/statusAlert'

export default {
  components: {
    statusAlert
  },
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
    height: 100% !important;
  }

  .swal2-modal {
    font-family: 'Roboto' !important;
  }
</style>
