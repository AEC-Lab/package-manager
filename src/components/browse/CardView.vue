<template>
  <div>
    <div v-for="pkg in packages" :key="pkg.id">
      <div class="vo-card" @click="showDetails(pkg)">
        <Card :pkg="pkg"></Card>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { Package } from "../../../types/package";
import Card from "@/components/Card.vue";

@Component({
  name: "CardView",
  components: {
    Card
  }
})
export default class CardView extends Vue {
  @Prop() readonly packages!: Package[];
  @Prop() readonly showDetails!: (pkg: Package) => void;
}
</script>

<style lang="scss" scoped></style>
