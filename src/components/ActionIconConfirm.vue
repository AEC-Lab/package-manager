<template>
  <v-btn icon v-if="!isActive" @click="isActive = true">
    <v-icon>{{ icon }}</v-icon>
  </v-btn>
  <div v-else class="active">
    <v-btn icon @click="isActive = false">
      <v-icon>mdi-close</v-icon>
    </v-btn>
    <v-btn icon :color="acceptColor" @click="accept(acceptAction)">
      <v-icon>mdi-check</v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  props: {
    icon: String,
    acceptColor: String,
    acceptAction: Function
  },
  data() {
    return {
      isActive: false
    };
  },
  methods: {
    async accept(callback: Function) {
      await callback();
      this.isActive = false;
    }
  }
});
</script>

<style lang="scss" scoped>
.active {
  display: flex;
  flex-direction: row;
  justify-content: center;
}
</style>
