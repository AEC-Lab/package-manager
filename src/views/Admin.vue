<template>
  <v-container id="container">
    <v-btn @click="test" :loading="loading">Test Button</v-btn>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Admin extends Vue {
  // DATA PROPERTIES
  loading = false;

  async test() {
    this.loading = true;
    await this.$store.dispatch("github/init");
    this.loading = false;
  }
}
</script>

<style lang="scss" scoped>
#container {
  margin-left: 55px;
}
</style>
