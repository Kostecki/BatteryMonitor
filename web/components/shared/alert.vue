<template>
  <v-alert
    v-model="alert.visible"
    :type="alert.type"
    border="bottom"
    class="alert"
    transition="fade-transition"
    @input="onClose"
  >
    {{ alert.message }}
  </v-alert>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

export default {
  computed: {
    ...mapState('modules/shared', ['alert']),
    modalVisible () {
      return this.alert.visible
    }
  },
  watch: {
    modalVisible (val) {
      if (val) {
        setTimeout(() => {
          this.clearAlert()
        }, this.alert.timeout)
      }
    }
  },
  methods: {
    ...mapMutations('modules/shared', ['toggleAlert', 'clearAlert']),
    onClose () {
      this.clearAlert()
    }
  }
}
</script>

<style scoped>
  .alert {
    position: fixed;
    width: 100%;
    left: 0;
    z-index: 100;
    margin: 0;
  }
</style>
