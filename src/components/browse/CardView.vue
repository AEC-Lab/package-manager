<template>
  <div id="card-view">
    <v-card
      flat
      v-for="enterpriseArray in packagesByEnterprise"
      :key="enterpriseArray[0].id"
      class="transparent"
    >
      <v-card-title class="vo-card-title-light">
        <v-img
          v-if="enterpriseArray[0].imageUrl !== ''"
          :src="enterpriseArray[0].imageUrl"
          height="40"
          max-width="150"
          contain
          :alt="enterpriseArray[0].name"
          :title="enterpriseArray[0].name"
          class="enterprise-logo"
        >
        </v-img>
        <span v-else>
          {{ enterpriseArray[0].name }}
        </span>
      </v-card-title>
      <v-card-text class="d-flex flex-row flex-wrap">
        <div v-for="pkg in enterpriseArray[1]" :key="pkg.id">
          <div class="vo-card" @click="showDetails(pkg)">
            <Card :pkg="pkg"></Card>
          </div>
        </div>
      </v-card-text>
    </v-card>
    <v-card flat class="transparent">
      <v-card-title class="vo-card-title-light">Public</v-card-title>
      <v-card-text class="d-flex flex-row flex-wrap">
        <div v-for="pkg in packagesPublic" :key="pkg.id">
          <div class="vo-card" @click="showDetails(pkg)">
            <Card :pkg="pkg"></Card>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { Package } from "../../../types/package";
import { Enterprise } from "../../../types/enterprise";
import Card from "@/components/Card.vue";

@Component({
  name: "CardView",
  components: {
    Card
  }
})
export default class CardView extends Vue {
  @Prop() readonly packages!: Package[];
  @Prop() readonly packagesPublic!: Package[];
  @Prop() readonly packagesByEnterprise!: [Enterprise, Package[]][];
  @Prop() readonly showDetails!: (pkg: Package) => void;
}
</script>

<style lang="scss">
#card-view {
  .enterprise-logo {
    .v-image__image--contain {
      background-position: left center !important;
    }
  }
}
</style>

<style lang="scss" scoped>
.transparent {
  background: none;
}
</style>
