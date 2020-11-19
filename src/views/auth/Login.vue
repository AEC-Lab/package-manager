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
    <v-snackbar color="grey lighten-3" v-model="snackbar">
      <div id="snackText">{{ snackbarText }}</div>
    </v-snackbar>
    <v-overlay color="white" :opacity="0.75" :value="loading">
      <v-progress-circular :size="50" color="teal" indeterminate></v-progress-circular>
    </v-overlay>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { LoginCredentials } from "../../../types/auth";
import { fireAuth } from "@/integrations/firebase";
import { ipcRenderer } from "electron";

@Component
export default class Login extends Vue {
  // DATA PROPERTIES
  loading = true;

  user: LoginCredentials = {
    email: "",
    password: ""
  };

  snackbar = false;
  snackbarText = "";

  btnLoadingSignIn = false;
  btnLoadingGoogle = false;
  btnLoadingGithub = false;

  mode: "email" | "provider" = "email";

  // MOUNTED
  async mounted() {
    //   process.env.NODE_ENV === "production"
    // ? this.checkForUpdates()
    // : this.firebaseAuthListener();
    this.checkForUpdates();
    // lol
  }

  // METHODS
  flashMessage(message: string) {
    this.snackbar = true;
    this.snackbarText = message;
  }

  async firebaseAuthListener() {
    const unsubscribe = await fireAuth.onAuthStateChanged(async user => {
      await this.$store.dispatch("auth/onAuthStateChangedAction", user);
      if (user) {
        unsubscribe();
        this.$router.push("browse");
      } else {
        this.loading = false;
        this.snackbar = false;
      }
    });
  }

  checkForUpdates() {
    ipcRenderer.send("check-for-updates");
    // wait for response
    ipcRenderer.on("auto-updater-message", (event, payload) => {
      this.flashMessage(payload.message);
    });
    ipcRenderer.once("update-not-available", () => {
      this.firebaseAuthListener();
    });
    ipcRenderer.on("auto-updater-error", (event, payload) => {
      this.flashMessage(payload.message);
      // this.firebaseAuthListener();
    });
  }

  toggleMode() {
    this.mode = this.mode === "email" ? "provider" : "email";
  }

  async signInWithEmail() {
    this.btnLoadingSignIn = true;
    try {
      await this.$store.dispatch("auth/loginWithEmailAndPassword", this.user);
    } catch (error) {
      this.btnLoadingSignIn = false;
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
#snackText {
  color: teal;
}
</style>
