<template>
  <v-card
    class="mx-auto"
    max-width="500"
  >
    <v-card-text class="text--primary">
      <v-form
        ref="form"
        v-model="valid"
      >
        <v-container>
          <v-row justify="center" no-gutters>
            <v-col
              cols="12"
            >
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                :rules="rules.emailRules"
                required
                @keyup.enter="submit"
              />
            </v-col>
            <v-col
              cols="12"
            >
              <v-text-field
                v-model="password"
                label="Password"
                type="password"
                :rules="rules.passwordRules"
                required
                @keyup.enter="submit"
              />
            </v-col>
            <v-btn
              :disabled="!valid"
              :loading="loading"
              color="primary"
              class="mr-4 mt-5"
              @click="submit"
            >
              Log in
            </v-btn>
          </v-row>
        </v-container>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex'

export default {
  data () {
    return {
      email: null,
      password: null,
      valid: false,
      rules: {
        emailRules: [v => !!v || 'Email is required'],
        passwordRules: [v => !!v || 'Password is required']
      }
    }
  },
  computed: {
    ...mapState('modules/shared', ['loading'])
  },
  methods: {
    ...mapMutations('modules/shared', ['setMessage']),
    ...mapActions('modules/auth', ['signIn']),
    submit () {
      if (this.valid) {
        this.signIn({ email: this.email, password: this.password })
          .then(() => this.$router.push('/'))
      }
    }
  },
  head () {
    return {
      title: 'Log in'
    }
  }
}
</script>

<style scoped>
</style>
