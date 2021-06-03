<template>
  <v-container class="vo-container fill-height">
    <v-row align="center" justify="center">
      <v-col cols="10" sm="8" md="5" lg="5">
        <v-card>
          <ProviderLogin v-if="mode === 'provider'" :toggleMode="toggleMode" />
          <EmailLogin v-else-if="mode === 'email'" :toggleMode="toggleMode" />
        </v-card>
      </v-col>
    </v-row>
    <v-overlay color="white" :opacity="0.75" :value="loading" absolute>
      <v-progress-circular :size="50" color="primary" indeterminate></v-progress-circular>
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

  mode: "email" | "provider" = "provider";

  unsubscribe!: firebase.Unsubscribe;

  // METHODS
  async firebaseAuthListener() {
    const _unsubscribe = fireAuth.onAuthStateChanged(async user => {
      await this.$store.dispatch("auth/onAuthStateChangedAction", user);
      if (user) {
        _unsubscribe();
        await this.$store.dispatch("auth/initializeStoreData");
        this.$router.push("browse");
      }
    });
    return _unsubscribe;
  }

  checkForUpdates() {
    ipcRenderer.send("check-for-updates");
    // wait for response
    ipcRenderer.on("auto-updater-message", (event, payload) => {
      this.$snackbar.flash({ content: payload.message, color: "info", timeout: 3000 });
    });
    ipcRenderer.once("auto-updater-progress", (event, payload) => {
      this.$snackbar.flash({ content: payload.message, color: "info", timeout: -1 });
    });
    ipcRenderer.on("auto-updater-progress", (event, payload) => {
      this.$snackbar.update({ content: payload.message });
    });
    ipcRenderer.on("auto-updater-done", (event, payload) => {
      this.$snackbar.close({ content: payload.message, timeout: 3000 });
    });
    ipcRenderer.once("update-not-available", () => {
      this.loading = false;
      // this.firebaseAuthListener();
    });
    ipcRenderer.on("auto-updater-error", (event, payload) => {
      console.error(payload.message);
      this.$snackbar.flash({ content: payload.message, color: "error" });
      this.loading = false;
      // this.firebaseAuthListener();
    });
  }

  toggleMode() {
    this.mode = this.mode === "email" ? "provider" : "email";
  }

  // LIFECYCLE HOOKS
  async mounted() {
    // Check if redirected (for custom auth provider flow)
    // const result = await fireAuth.getRedirectResult();
    // if (result.user) {
    //   this.loading = true;
    // } else {
    //   this.checkForUpdates();
    // }
    this.checkForUpdates();

    this.unsubscribe = await this.firebaseAuthListener();
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
</style>
