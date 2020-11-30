<template>
  <div>
    <div v-for="repo in repos" :key="repo.id">
      <div class="card" @click="showDetails(repo)">
        <Card :name="repo.name"></Card>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { Repository } from "../../../types/repos";
import Card from "@/components/Card.vue";

@Component({
  name: "CardView",
  components: {
    Card
  }
})
export default class CardView extends Vue {
  @Prop() readonly repos!: Repository[];
  @Prop() readonly showDetails!: (repo: Repository) => void;
}
</script>

<style lang="scss" scoped>
.card {
  float: left;
  margin-right: 20px;
  margin-bottom: 20px;

  &:not(:first-child) {
    margin-left: 20px;
  }
}
</style>
