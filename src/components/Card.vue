<template>
  <v-card class="mx-auto" style="cursor: pointer" max-height="250" max-width="200">
    <v-img
      class="white--text align-end"
      height="100px"
      src="https://cdn.vuetifyjs.com/images/cards/docks.jpg"
    >
    </v-img>
    <v-card-title id="title" class="text-truncate">{{ repo.name }}</v-card-title>
    <v-card-subtitle class="pb-0">{{ repo.owner }}</v-card-subtitle>
    <v-card-actions>
      <v-btn
        block
        :loading="isLoading"
        :color="buttonConfig.color"
        @click="e => installActionHandlerWrapper(e, repo, buttonConfig.handler)"
      >
        {{ buttonConfig.text }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { Repository } from "types/repos";
import { getButtonConfig } from "../utils/install";

@Component
export default class Card extends Vue {
  @Prop() readonly repo!: Repository;

  // DATA PROPERTIES
  isLoading = false;

  // COMPUTED PROPERTIES
  get buttonConfig() {
    return getButtonConfig(this.repo.id);
  }

  // METHODS
  async installActionHandlerWrapper(event: Event, repo: Repository, handler: Function) {
    this.isLoading = true;
    await handler(event, repo);
    this.isLoading = false;
  }
}
</script>
<style lang="scss" scoped>
#title {
  display: block;
}
</style>
