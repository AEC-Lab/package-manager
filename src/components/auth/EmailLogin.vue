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
        color="primary"
        dark
      >
        Sign In
      </v-btn>
      <v-spacer />
      <div class="text-end">
        <div class="vo-link" @click="() => $router.push('/register')" color="teal darken-1">
          Register
        </div>
        <div class="vo-link" @click="resetPassword">Forgot password?</div>
      </div>
    </v-card-actions>
    <div class="vo-link mt-8" @click="toggleMode">
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
      this.$snackbar.flash({ content: error, color: "error" });
      console.log(error);
    }
  }

  /**
   * dispatches password reset
   */
  async resetPassword() {
    if (!this.user.email) {
      this.$snackbar.flash({ content: "No email address provided", color: "error" });
    } else if (await this.$store.dispatch("auth/checkEmailExists", this.user.email)) {
      // Verify if email address exists (and is verified) in Firebase auth
      // If so, fire function that sends password reset to email
      if (await this.$store.dispatch("auth/sendPasswordResetEmail", this.user.email)) {
        this.$snackbar.flash({
          content: "An email has been sent to your address to reset your password",
          color: "success"
        });
      } else {
        this.$snackbar.flash({ content: "Something went wrong", color: "error" });
      }
    } else {
      this.$snackbar.flash({ content: "No account exists for given email", color: "error" });
    }
  }
}
</script>

<style lang="scss" scoped></style>
