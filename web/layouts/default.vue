<template>
  <v-app id="main" :style="{background: $vuetify.theme.themes['light'].background}">
    <v-main>
      <!-- Status Alert -->
      <statusAlert />

      <v-container fluid>
        <nuxt />
        <v-bottom-navigation
          grow
          fixed
          color="orange"
          height="70"
          :value="activeTab"
        >
          <v-btn to="/" :value="0">
            <span>Batteries</span>
            <v-icon>mdi-battery-high</v-icon>
          </v-btn>
          <v-divider vertical />

          <v-btn v-if="loggedIn" :value="1" @click="() => toggleBatteryModal('add')">
            <span>New Battery</span>
            <v-icon>mdi-battery-positive</v-icon>
          </v-btn>

          <v-btn v-if="!loggedIn" :value="2">
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
      activeTab: null
    }
  },
  computed: {
    ...mapState(['loggedIn'])
  },
  created () {
    this.setActiveTab()
  },
  methods: {
    ...mapMutations('modules/batteries', ['toggleBatteryModal']),
    ...mapMutations('modules/measurements', ['toggleMeasurementModal']),
    setActiveTab () {
      switch (this.$nuxt.$route.name) {
        case 'index':
          this.activeTab = 0
          break

        default:
          this.activeTab = null
          break
      }
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
