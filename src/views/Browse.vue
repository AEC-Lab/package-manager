<template>
  <div>
    <v-container class="vo-container">
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
import { PackageStatus } from "../../types/enums";

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
      return $store.state.packages.packages.filter((pkg: Package) => pkg.status === PackageStatus.Active);
    });

    const filteredPackages: ComputedRef<Package[]> = computed(() => {
      if (searchText.value == "") return packages.value;
      else {
        return packages.value.filter(pkg => {
          return [
            pkg.name,
            pkg.description,
            $store.getters["authors/getAuthorNameById"](pkg.authorId),
            ...pkg.tags
          ].some(field => field.toLowerCase().includes(searchText.value.toLowerCase().trim()));
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

<style lang="scss"></style>
