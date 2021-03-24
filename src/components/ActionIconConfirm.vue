<template>
  <v-btn icon v-if="!isActive" @click="init">
    <v-icon :color="disabled ? 'rgb(222,222,222)' : undefined">{{ icon }}</v-icon>
  </v-btn>
  <div v-else class="active">
    <v-btn icon @click="cancel">
      <v-icon>mdi-close</v-icon>
    </v-btn>
    <v-btn icon :color="acceptColor" @click="accept">
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
    initAction: Function,
    cancelAction: Function,
    acceptAction: Function,
    disabled: Boolean
  },
  data() {
    return {
      isActive: false
    };
  },
  methods: {
    init() {
      if (this.disabled) return;
      if (this.initAction) this.initAction();
      this.isActive = true;
    },
    cancel() {
      if (this.cancelAction) this.cancelAction();
      this.isActive = false;
    },
    async accept() {
      try {
        await this.acceptAction();
        this.isActive = false;
      } catch (error) {
        console.log(error);
      }
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
