<template>
  <v-snackbar v-model="show" text :color="color" :timeout="timeout">
    <div id="snackText">{{ message }}</div>
    <template v-slot:action="{ attrs }">
      <v-icon v-bind="attrs" :color="color" @click="show = false">mdi-close</v-icon>
    </template>
  </v-snackbar>
</template>

<script>
export default {
  data() {
    return {
      show: false,
      message: "",
      color: "",
      timeout: 5000
    };
  },

  created() {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === "snackbar/flash") {
        this.message = state.snackbar.content;
        this.color = state.snackbar.color;
        this.timeout = state.snackbar.timeout;
        this.show = true;
      }
    });
  }
};
</script>
<style lang="scss" scoped>
#snackText {
  font-weight: 500;
}
</style>
