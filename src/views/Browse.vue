<template>
  <v-container id="browse">
    <div v-for="r in repositories" :key="r.id">
      <v-btn>{{ r.name }} </v-btn>
    </div>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "@vue/composition-api";

export default defineComponent({
  setup(props, context) {
    const test = ref("test");
    const $store = context.root.$store;

    $store.dispatch("repositoriesListener");

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
#browse {
  background-color: black;
}
</style>
