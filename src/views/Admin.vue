<template>
  <v-container id="container">
    <v-btn @click="test" :loading="loading">Test Button</v-btn>
    <v-snackbar color="grey lighten-3" v-model="snackbar">
      <div id="snackText">{{ snackbarText }}</div>
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Admin extends Vue {
  // DATA PROPERTIES
  loading = false;

  snackbar = false;
  snackbarText = "";

  // METHODS
  flashMessage(message: string) {
    this.snackbar = true;
    this.snackbarText = message;
  }

  async test() {
    this.loading = true;
    await this.$store.dispatch("github/init");
    this.loading = false;
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
