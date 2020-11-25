<template>
  <v-container id="container">
    <div v-for="r in repositories" :key="r.id">
      <div class="card">
        <Card :name="r.name" :owner="r.full_name"></Card>
      </div>
    </div>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "@vue/composition-api";
import Card from "@/components/Card.vue";

// import Component from "vue-class-component";
// @Component({
//   components: {
//     Card,
//   },
// })
export default defineComponent({
  components: {
    Card
  },
  setup(props, context) {
    const test = ref("test");
    const $store = context.root.$store;

    $store.dispatch("repos/repositoriesListener");

    const repositories = computed(() => {
      return $store.state.repos.repositories;
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
.card {
  float: left;
  margin: 10px;
}
</style>
