<template>
  <div>
    <v-container class="vo-container">
      <ControlBar :searchText.sync="searchText" :displayToggle.sync="displayToggle" />
      <CardView
        v-if="displayToggle === 0"
        :packages="filteredPackages"
        :packagesPublic="packagesPublic"
        :packagesByEnterprise="packagesByEnterprise"
        :showDetails="showDetails"
      />
      <TableView
        v-else-if="displayToggle === 1"
        :packages="filteredPackages"
        :packagesPublic="packagesPublic"
        :packagesByEnterprise="packagesByEnterprise"
        :showDetails="showDetails"
      />
    </v-container>
    <Details v-if="selectedPackage" :pkg="selectedPackage" :closeDetails="closeDetails" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, ComputedRef, Ref } from "@vue/composition-api";
import Card from "@/components/Card.vue";
import Details from "@/components/browse/Details.vue";
import ControlBar from "@/components/browse/ControlBar.vue";
import CardView from "@/components/browse/CardView.vue";
import TableView from "@/components/browse/TableView.vue";
import { Package } from "../../types/package";
import { EnterprisePackageAccess, PackageStatus, PackageVisibility } from "../../types/enums";
import { User } from "../../types/auth";
import { Enterprise } from "../../types/enterprise";
import { getEmailDomain } from "../utils/helpers";

export default defineComponent({
  components: {
    Card,
    Details,
    ControlBar,
    CardView,
    TableView
  },
  name: "Browse",
  setup(props, context) {
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

    const packagesPublic: ComputedRef<Package[]> = computed(() => {
      return filteredPackages.value.filter((pkg: Package) => pkg.visibility === PackageVisibility.Public);
    });

    const packagesByEnterprise: ComputedRef<[Enterprise, Package[]][]> = computed(() => {
      const user: User = $store.state.auth.user;
      if (!user?.email) return [];
      const userDomain = getEmailDomain(user.email);
      const result: [Enterprise, Package[]][] = [];
      const enterprises: Enterprise[] = $store.state.enterprises.enterprises;
      for (const enterprise of enterprises) {
        if (
          enterprise.memberDomains.includes(userDomain) ||
          enterprise.externalMembers.includes(user.email)
        ) {
          result.push([
            enterprise,
            filteredPackages.value.filter((pkg: Package) => {
              if (pkg.id in enterprise.packageConfig) {
                if (enterprise.packageConfig[pkg.id] === EnterprisePackageAccess.Custom) {
                  if (
                    user.email &&
                    user.email in enterprise.memberConfig &&
                    enterprise.memberConfig[user.email].includes(pkg.id)
                  )
                    return true;
                  else return false;
                } else return true;
              } else return false;
            })
          ]);
        }
      }
      return result;
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
      packagesPublic,
      packagesByEnterprise,
      selectedPackage,
      showDetails,
      closeDetails
    };
  }
});
</script>

<style lang="scss"></style>
