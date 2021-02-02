<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="10" sm="8" md="5" lg="5">
        <v-card>
          <v-toolbar color="grey lighten-3" flat>
            <v-toolbar-title>
              <h1 class="overline">
                Package Manager
              </h1>
            </v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form>
              <v-text-field label="Email" disabled :placeholder="user.email" />
              <v-text-field label="Password" type="password" v-model="user.password" />
              <v-text-field label="Confirm Password" type="password" v-model="user.passwordConfirmation" />
            </v-form>
            <v-card-actions>
              <v-btn
                @submit="handleResetPassword"
                @click="handleResetPassword"
                :loading="btnLoadingSubmit"
                color="teal darken-1"
                dark
              >
                Submit
              </v-btn>
            </v-card-actions>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { fireAuth } from "@/integrations/firebase";

@Component({
  name: "ResetPassword"
})
export default class ResetPassword extends Vue {
  // PROPS
  @Prop() readonly mode!: any;
  @Prop() readonly actionCode!: any;
  @Prop() readonly apiKey!: any;
  @Prop() readonly lang!: any;
  @Prop() readonly continueUrl!: any;

  // DATA PROPERTIES
  user: any = {
    email: null,
    password: "",
    passwordConfirmation: ""
  };

  btnLoadingSubmit = false;

  snackbar = false;
  snackbarText = "";

  // METHODS
  async handleResetPassword() {
    // First check if form input is valid
    if (!this.user.password || !this.user.passwordConfirmation) {
      this.$snackbar.flash({ content: "Password field(s) missing", color: "error" });
      return;
    } else if (this.user.passwordConfirmation !== this.user.password) {
      this.$snackbar.flash({ content: "Passwords do not match", color: "error" });
      return;
    }

    this.btnLoadingSubmit = true;

    // Confirm password reset and save the new password
    try {
      await fireAuth.confirmPasswordReset(this.actionCode, this.user.password);

      // Sign in user
      const { email, password } = this.user;
      const success = await this.$store.dispatch("auth/loginWithEmailAndPassword", { email, password });
      if (success) {
        // Redirect to home page
        await setTimeout(() => {
          this.$snackbar.flash({ content: "Password reset successful!", color: "success" });
          this.$router.push({
            path: "/browse"
          });
        }, 1000);
      } else {
        this.btnLoadingSubmit = false;
        this.$snackbar.flash({ content: "Invalid credentials", color: "error" });
      }
    } catch (error) {
      this.btnLoadingSubmit = false;
      this.$snackbar.flash({ content: error.message, color: "error" });
    }
  }

  // LIFECYCLE HOOKS
  async mounted() {
    try {
      this.user.email = await fireAuth.verifyPasswordResetCode(this.actionCode);
    } catch (error) {
      const msg = error.message + "<br>" + "Please click 'Forgot Password' to request a new link.";
      this.$snackbar.flash({ content: msg, color: "error" });
      this.$router.push({
        path: "/login"
      });
    }
  }
}
</script>

<style lang="scss" scoped></style>
