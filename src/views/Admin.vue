<template>
  <v-container id="container">
    <v-btn @click="test">Get Repositories</v-btn>
    <v-snackbar color="grey lighten-3" v-model="snackbar">
      <div id="snackText">{{ snackbarText }}</div>
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";

@Component
export default class Admin extends Vue {
  // DATA PROPERTIES
  loading = true;

  snackbar = false;
  snackbarText = "";

  get repositories() {
    return this.$store.state.github.repositories;
  }

  @Watch("repositories")
  onTokenChanged(val: string) {
    console.log("Repositories: ", val);
  }

  // METHODS
  flashMessage(message: string) {
    this.snackbar = true;
    this.snackbarText = message;
  }

  async test() {
    this.$store.dispatch("github/getRepositories");
  }
}
</script>

<style lang="scss" scoped>
#snackText {
  color: teal;
}
#container {
  margin-left: 55px;
}
</style>
