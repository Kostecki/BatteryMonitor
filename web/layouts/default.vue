<template>
  <v-app id="main" :style="{background: $vuetify.theme.themes['light'].background}">
    <v-main>
      <alert />

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

          <v-btn v-if="authenticated" :value="1" @click="() => toggleBatteryModal('add')">
            <span>New Battery</span>
            <v-icon>mdi-battery-positive</v-icon>
          </v-btn>
          <v-divider v-if="authenticated" vertical />

          <v-btn v-if="!authenticated" :value="2" @click="$router.push('/login')">
            <span>Log in</span>
            <v-icon>mdi-lock-open-outline</v-icon>
          </v-btn>

          <v-btn v-if="authenticated" :value="3" @click="logout">
            <span>Log out</span>
            <v-icon>mdi-lock-outline</v-icon>
          </v-btn>
        </v-bottom-navigation>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import * as firebase from 'firebase/app'
import 'firebase/auth'

import { mapState, mapMutations, mapActions } from 'vuex'
import alert from '../components/shared/alert'

export default {
  components: {
    alert
  },
  data () {
    return {
      activeTab: null
    }
  },
  computed: {
    ...mapState('modules/auth', ['authenticated'])
  },
  mounted () {
    this.setupFirebase()
    this.setActiveTab()
  },
  methods: {
    ...mapMutations('modules/modals', ['toggleBatteryModal']),
    ...mapActions('modules/auth', ['autoSignIn', 'signOut']),
    setupFirebase () {
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          this.autoSignIn()
        }
      })
    },
    setActiveTab () {
      switch (this.$nuxt.$route.name) {
        case 'index':
          this.activeTab = 0
          break

        case 'login':
          this.activeTab = 2
          break

        default:
          this.activeTab = null
          break
      }
    },
    logout () {
      this.signOut()
        .then(() => this.$router.push('/'))
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
