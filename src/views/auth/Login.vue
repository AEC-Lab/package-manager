<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-toolbar color="grey lighten-3" flat>
            <v-toolbar-title>
              <h1 class="overline">
                Package Manager
              </h1>
            </v-toolbar-title>
          </v-toolbar>
          <v-card-text v-if="mode === 'email'">
            <v-form>
              <v-text-field label="Email" v-model="user.email" />
              <v-text-field label="Password" type="password" v-model="user.password" />
            </v-form>
            <v-card-actions>
              <v-btn @submit="signInWithEmail" @click="signInWithEmail" color="teal darken-1" dark>
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
          <v-card-text v-else-if="mode === 'provider'" class="mt-10">
            <v-btn
              @click="signInWithGoogle"
              :loading="btnLoadingGoogle"
              class="mb-2"
              large
              color="teal darken-1"
              dark
              width="100%"
            >
              <span class="mr-4">
                Sign in with Google
              </span>
              <v-icon right dark color="white">
                mdi-google
              </v-icon>
            </v-btn>
            <v-btn
              @click="signInWithGithub"
              :loading="btnLoadingGithub"
              large
              color="teal darken-1"
              dark
              width="100%"
            >
              <span class="mr-4">
                Sign in with GitHub
              </span>
              <v-icon right dark color="white">
                mdi-github
              </v-icon>
            </v-btn>
            <div class="link mt-8" @click="toggleMode">
              Sign in with Email and Password
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-snackbar v-model="snackbar">
      {{ snackbarText }}
      <template v-slot:action="{ attrs }">
        <v-btn color="red" text v-bind="attrs" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { LoginCredentials, User } from "../../../types/auth";

@Component
export default class Login extends Vue {
  // DATA PROPERTIES
  user: LoginCredentials = {
    email: "",
    password: ""
  };

  snackbar = false;
  snackbarText = "";

  btnLoadingGoogle = false;
  btnLoadingGithub = false;

  mode: "email" | "provider" = "email";

  // MOUNTED
  mounted() {
    this.snackbar = true;
    this.snackbarText = "Checking for updates...";
  }

  // COMPUTED
  get authUser() {
    return this.$store.state.auth.user;
  }

  // WATCH
  @Watch("authUser")
  onUserChanged(val: User | null, oldVal: User | null) {
    if (oldVal == null && val) {
      this.$router.push("browse");
    }
  }

  // METHODS
  toggleMode() {
    this.mode = this.mode === "email" ? "provider" : "email";
  }

  async signInWithEmail() {
    try {
      await this.$store.dispatch("auth/loginWithEmailAndPassword", this.user);
    } catch (error) {
      this.snackbarText = error;
      this.snackbar = true;
      console.log(error);
    }
  }

  async signInWithGoogle() {
    this.btnLoadingGoogle = true;
    try {
      await this.$store.dispatch("auth/loginWithGoogle");
    } catch (error) {
      console.log(error);
    }
  }

  async signInWithGithub() {
    this.btnLoadingGithub = true;
    try {
      await this.$store.dispatch("auth/loginWithGithub");
    } catch (error) {
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
