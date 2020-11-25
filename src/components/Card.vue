<template>
  <v-card class="mx-auto" max-height="250" max-width="200">
    <v-img
      class="white--text align-end"
      height="100px"
      src="https://cdn.vuetifyjs.com/images/cards/docks.jpg"
    >
    </v-img>
    <v-card-title id="title" class="text-truncate">{{ name }}</v-card-title>
    <v-card-subtitle class="pb-0">{{ owner }}</v-card-subtitle>
    <v-card-actions>
      <v-btn block color="orange" text>
        Install
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "Card",
  props: ["name", "owner"],
  data: () => ({}),
  methods: {}
});
</script>
<style lang="scss" scoped>
#title {
  display: block;
}
</style>
