<template>
  <div>
    <v-container id="browse-container">
      <v-row id="control-bar">
        <v-col cols="8">
          <v-toolbar dense floating>
            <v-text-field
              hide-details
              prepend-icon="mdi-magnify"
              single-line
              v-model="searchText"
            ></v-text-field>
            <v-icon @click="clearSearch">
              mdi-close
            </v-icon>
          </v-toolbar>
        </v-col>
        <v-spacer />
        <v-col>
          <v-btn-toggle mandatory v-model="displayToggle" id="toggle-buttons">
            <v-btn>
              <v-icon>mdi-view-grid</v-icon>
            </v-btn>
            <v-btn>
              <v-icon>mdi-view-list</v-icon>
            </v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>

      <div v-if="displayToggle === 0">
        <div v-for="repo in filteredRepos" :key="repo.id">
          <div class="card" @click="showDetails(repo)">
            <Card :name="repo.name"></Card>
          </div>
        </div>
      </div>

      <div v-else-if="displayToggle === 1">
        <v-simple-table fixed-header height="10%">
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left">
                  Tool Name
                </th>
                <th class="text-left">
                  Description
                </th>
                <th class="text-left">
                  Version
                </th>
                <th class="text-left">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="repo in filteredRepos" :key="repo.id" @click="showDetails(repo)">
                <td>{{ repo.name }}</td>
                <td>{{ repo.full_name }}</td>
                <td>{{ repo.id }}</td>
                <td>
                  <v-btn small>Install</v-btn>
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </div>
    </v-container>
    <Details v-if="selectedRepo" :repo="selectedRepo" :closeDetails="closeDetails" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, ComputedRef, Ref } from "@vue/composition-api";
import Card from "@/components/Card.vue";
import Details from "@/components/Details.vue";
import { Repository } from "../../types/repos";

export default defineComponent({
  components: {
    Card,
    Details
  },
  setup(props, context) {
    const searchText = ref("");
    const displayToggle = ref(0);
    const selectedRepo: Ref<Repository | null> = ref(null);
    const $store = context.root.$store;

    $store.dispatch("repos/repositoriesListener");

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

    function clearSearch() {
      searchText.value = "";
    }

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
      clearSearch,
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
}

.card {
  float: left;
  margin-right: 20px;
  margin-bottom: 20px;

  &:not(:first-child) {
    margin-left: 20px;
  }
}

#control-bar {
  margin-bottom: 30px;
  // width: 100%;
}

#toggle-buttons {
  // float: right;
  & > .v-btn {
    width: 75px;
  }
}
</style>
