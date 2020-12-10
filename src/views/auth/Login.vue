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
          <ProviderLogin v-if="mode === 'provider'" :toggleMode="toggleMode" />
          <EmailLogin v-else-if="mode === 'email'" :toggleMode="toggleMode" :flashMessage="flashMessage" />
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
import { fireAuth } from "@/integrations/firebase";
import { ipcRenderer } from "electron";
import ProviderLogin from "@/components/auth/ProviderLogin.vue";
import EmailLogin from "@/components/auth/EmailLogin.vue";

@Component({
  components: { ProviderLogin, EmailLogin }
})
export default class Login extends Vue {
  // DATA PROPERTIES
  loading = true;

  snackbar = false;
  snackbarText = "";

  mode: "email" | "provider" = "provider";

  unsubscribe!: firebase.Unsubscribe;

  // METHODS
  flashMessage(message: string) {
    this.snackbar = true;
    this.snackbarText = message;
  }

  async firebaseAuthListener() {
    const _unsubscribe = fireAuth.onAuthStateChanged(async user => {
      await this.$store.dispatch("auth/onAuthStateChangedAction", user);
      if (user) {
        _unsubscribe();
        this.$router.push("browse");
      }
    });
    return _unsubscribe;
  }

  checkForUpdates() {
    ipcRenderer.send("check-for-updates");
    // wait for response
    ipcRenderer.on("auto-updater-message", (event, payload) => {
      this.flashMessage(payload.message);
    });
    ipcRenderer.once("update-not-available", () => {
      this.loading = false;
      this.snackbar = false;
      // this.firebaseAuthListener();
    });
    ipcRenderer.on("auto-updater-error", (event, payload) => {
      console.error(payload.message);
      this.flashMessage(payload.message);
      this.loading = false;
      this.snackbar = false;
      // this.firebaseAuthListener();
    });
  }

  toggleMode() {
    this.mode = this.mode === "email" ? "provider" : "email";
  }

  // LIFECYCLE HOOKS
  async mounted() {
    //   process.env.NODE_ENV === "production"
    // ? this.checkForUpdates()
    // : this.firebaseAuthListener();
    this.unsubscribe = await this.firebaseAuthListener();
    this.checkForUpdates();
    // lol
  }

  beforeDestroy() {
    this.unsubscribe();
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
