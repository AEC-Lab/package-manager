<template>
  <v-container class="vo-container fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-text>
            <v-form v-model="isFormValid" ref="form" lazy-validation>
              <v-text-field label="Name" v-model="user.name" />
              <v-text-field label="Email" v-model="user.email" :rules="emailRules" required lazy-validation />
              <v-text-field
                label="Password"
                type="password"
                v-model="user.password"
                :rules="passwordRules"
                required
              />
              <v-text-field
                label="Confirm Password"
                type="password"
                v-model="user.passwordConfirmation"
                :rules="passwordConfirmationRules"
                required
              />
            </v-form>
            <v-card-actions>
              <v-btn @submit="register" @click="register" color="teal darken-1" dark :loading="processing">
                Register
              </v-btn>
              <v-spacer />
              <div class="text-end">
                <div class="link" @click="() => $router.push('/login')">
                  Already registered? Sign in
                </div>
              </div>
            </v-card-actions>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { RegisterCredentials } from "../../../types/auth";

@Component
export default class Register extends Vue {
  // DATA PROPERTIES
  user: RegisterCredentials = {
    email: "",
    name: "",
    password: "",
    passwordConfirmation: ""
  };

  isFormValid = false;

  processing = false;

  emailRules = [
    (v: string) => !!v || "Field is required",
    (v: string) => this.isValidEmail(v) || "Invalid email"
  ];
  passwordRules = [(v: string) => !!v || "Field is required"];
  passwordConfirmationRules = [(v: string) => v === this.user.password || "Passwords do not match"];

  // METHODS
  async register() {
    const isValid = (this.$refs.form as Vue & {
      validate: () => boolean;
    }).validate();
    if (!isValid) return;
    try {
      this.processing = true;
      await this.$store.dispatch("auth/registerWithEmailAndPassword", this.user);
      const loggedOut = await this.$store.dispatch("auth/logout");
      if (loggedOut) {
        this.$router.push("login");
        this.$snackbar.flash({
          content: "A verification link has been sent to your email.",
          color: "success"
        });
      }
    } catch (error) {
      this.$snackbar.flash({ content: error, color: "error" });
      this.processing = false;
      console.log(error);
    }
  }

  isValidEmail(email: string) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; // eslint-disable-line
    return re.test(email);
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
