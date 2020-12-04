<template>
  <v-card-text>
    <v-form>
      <v-text-field label="Email" v-model="user.email" />
      <v-text-field label="Password" type="password" v-model="user.password" />
    </v-form>
    <v-card-actions>
      <v-btn
        @submit="signInWithEmail"
        @click="signInWithEmail"
        :loading="btnLoadingSignIn"
        color="teal darken-1"
        dark
      >
        Sign In
      </v-btn>
      <v-spacer />
      <div class="text-end">
        <div class="link" @click="() => $router.push('/register')" color="teal darken-1">
          Register
        </div>
        <div class="link" @click="() => {}">Forgot password?</div>
      </div>
    </v-card-actions>
    <div class="link mt-8" @click="toggleMode">
      Sign in with Third Party Provider
    </div>
  </v-card-text>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { LoginCredentials } from "../../../types/auth";

@Component
export default class ProviderLogin extends Vue {
  // PROPS
  @Prop() readonly toggleMode!: () => void;
  @Prop() readonly flashMessage!: (msg: string) => void;

  // DATA PROPERTIES
  user: LoginCredentials = {
    email: "",
    password: ""
  };
  btnLoadingSignIn = false;

  // METHODS
  async signInWithEmail() {
    this.btnLoadingSignIn = true;
    try {
      await this.$store.dispatch("auth/loginWithEmailAndPassword", this.user);
    } catch (error) {
      this.btnLoadingSignIn = false;
      this.flashMessage(error);
      console.log(error);
    }
  }
}
</script>

<style lang="scss" scoped>
.link {
  cursor: pointer;
  color: #00897b;
  &:hover {
    color: #13aa9b;
  }
}
</style>
