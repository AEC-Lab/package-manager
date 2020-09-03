<template>
  <v-container id="container">Admin</v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "@vue/composition-api";

export default defineComponent({
  setup(props, context) {
    const test = ref("test");
    const $store = context.root.$store;

    const repositories = computed(() => {
      return $store.state.repositories;
    });

    return {
      test,
      repositories
    };
  }
});
</script>
<style lang="scss">
#container {
  background-color: rgb(224, 224, 224);
  height: 100vh;
}
</style>
