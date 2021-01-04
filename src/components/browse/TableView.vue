<template>
  <v-data-table
    fixed-header
    height="10%"
    :headers="headers"
    :items="repos"
    :items-per-page="10"
    class="elevation-1"
  >
    <template v-slot:item="{ item }">
      <tr @click="showDetails(item)" style="cursor: pointer">
        <td>{{ item.name }}</td>
        <td>{{ repoDescription(item.id) }}</td>
        <td>{{ item.id }}</td>
        <td>
          <v-btn
            small
            block
            :loading="isLoading.includes(item.id)"
            :color="getButtonConfig(item).color"
            @click="e => installActionHandlerWrapper(e, item, getButtonConfig(item).handler)"
          >
            {{ getButtonConfig(item).text }}
          </v-btn>
        </td>
      </tr>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import { GenericObject } from "types/github";
import { Vue, Component, Prop } from "vue-property-decorator";
import { Repository } from "../../../types/repos";
import { getButtonConfig } from "../../utils/install";

@Component({
  name: "TableView"
})
export default class TableView extends Vue {
  @Prop() readonly repos!: Repository[];
  @Prop() readonly showDetails!: (repo: Repository) => void;

  // DATA PROPERTIES
  headers = [
    { text: "Tool Name", value: "toolName" },
    { text: "Description", value: "description" },
    { text: "Version", value: "version" },
    { text: "Action", value: "action" }
  ];

  isLoading: number[] = [];

  // COMPUTED PROPERTIES
  get repoDescription() {
    return (id: number) => {
      return this.$store.state.github.repositories.find((r: GenericObject) => r.id === id)?.description;
    };
  }

  // METHODS
  getButtonConfig(repo: Repository) {
    return getButtonConfig(repo.id);
  }
  async installActionHandlerWrapper(event: Event, repo: Repository, handler: Function) {
    this.isLoading.push(repo.id);
    await handler(event, repo);
    this.isLoading = this.isLoading.filter(id => id !== repo.id);
  }
}
</script>

<style lang="scss" scoped></style>
