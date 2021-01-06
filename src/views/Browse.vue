<template>
  <div>
    <v-container id="browse-container">
      <ControlBar :searchText.sync="searchText" :displayToggle.sync="displayToggle" />
      <CardView v-if="displayToggle === 0" :packages="filteredPackages" :showDetails="showDetails" />
      <TableView v-else-if="displayToggle === 1" :packages="filteredPackages" :showDetails="showDetails" />
    </v-container>
    <Details v-if="selectedPackage" :pkg="selectedPackage" :closeDetails="closeDetails" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, ComputedRef, Ref, onMounted } from "@vue/composition-api";
import Card from "@/components/Card.vue";
import Details from "@/components/browse/Details.vue";
import ControlBar from "@/components/browse/ControlBar.vue";
import CardView from "@/components/browse/CardView.vue";
import TableView from "@/components/browse/TableView.vue";
import { Package } from "types/package";

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
      // $store.dispatch("github/init");
      $store.dispatch("packages/packagesListener");
      $store.dispatch("authors/authorsListener");
    });

    const searchText = ref("");
    const displayToggle = ref(0);
    const selectedPackage: Ref<Package | null> = ref(null);
    const $store = context.root.$store;

    const packages: ComputedRef<Package[]> = computed(() => {
      return $store.state.packages.packages;
    });

    const filteredPackages: ComputedRef<Package[]> = computed(() => {
      if (searchText.value == "") return packages.value;
      else {
        return packages.value.filter(pkg => {
          return pkg.name.toLowerCase().includes(searchText.value.toLowerCase());
        });
      }
    });

    function showDetails(pkg: Package) {
      selectedPackage.value = pkg;
    }

    function closeDetails() {
      selectedPackage.value = null;
    }

    return {
      searchText,
      displayToggle,
      packages,
      filteredPackages,
      selectedPackage,
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
