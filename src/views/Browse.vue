<template>
  <div>
    <v-container id="browse-container">
      <ControlBar :searchText.sync="searchText" :displayToggle.sync="displayToggle" />
      <CardView v-if="displayToggle === 0" :repos="filteredRepos" :showDetails="showDetails" />
      <TableView v-else-if="displayToggle === 1" :repos="filteredRepos" :showDetails="showDetails" />
    </v-container>
    <Details v-if="selectedRepo" :repo="selectedRepo" :closeDetails="closeDetails" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, ComputedRef, Ref, onMounted } from "@vue/composition-api";
import Card from "@/components/Card.vue";
import Details from "@/components/browse/Details.vue";
import ControlBar from "@/components/browse/ControlBar.vue";
import CardView from "@/components/browse/CardView.vue";
import TableView from "@/components/browse/TableView.vue";
import { Repository } from "../../types/repos";

export default defineComponent({
  components: {
    Card,
    Details,
    ControlBar,
    CardView,
    TableView
  },
  setup(props, context) {
    onMounted(() => {
      $store.dispatch("github/init");
      $store.dispatch("repos/repositoriesListener");
    });

    const searchText = ref("");
    const displayToggle = ref(0);
    const selectedRepo: Ref<Repository | null> = ref(null);
    const $store = context.root.$store;

    const repositories: ComputedRef<Repository[]> = computed(() => {
      return $store.state.repos.repositories;
    });

    const filteredRepos: ComputedRef<Repository[]> = computed(() => {
      if (searchText.value == "") return repositories.value;
      else {
        return repositories.value.filter(repo => {
          return repo.full_name.toLowerCase().includes(searchText.value.toLowerCase());
        });
      }
    });

    function showDetails(repo: Repository) {
      selectedRepo.value = repo;
    }

    function closeDetails() {
      selectedRepo.value = null;
    }

    return {
      searchText,
      displayToggle,
      repositories,
      filteredRepos,
      selectedRepo,
      showDetails,
      closeDetails
    };
  }
});
</script>

<style lang="scss">
#browse-container {
  background-color: rgb(224, 224, 224);
  height: 100%;
  max-width: 100%;
  padding: 20px;
  position: absolute;
  overflow: auto;
}
</style>
