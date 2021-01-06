<template>
  <v-data-table
    fixed-header
    height="10%"
    :headers="headers"
    :items="packages"
    :items-per-page="10"
    class="elevation-1"
  >
    <template v-slot:item="{ item }">
      <tr @click="showDetails(item)" style="cursor: pointer">
        <td>{{ item.name }}</td>
        <td>{{ item.description }}</td>
        <td>{{ $store.getters["authors/getAuthorNameById"](item.authorId) }}</td>
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
import { Package } from "types/package";
import { Vue, Component, Prop } from "vue-property-decorator";
import { getButtonConfig } from "../../utils/install";

@Component({
  name: "TableView"
})
export default class TableView extends Vue {
  @Prop() readonly packages!: Package[];
  @Prop() readonly showDetails!: (pkg: Package) => void;

  // DATA PROPERTIES
  headers = [
    { text: "Tool Name", value: "toolName" },
    { text: "Description", value: "description" },
    { text: "Author", value: "author" },
    { text: "Action", value: "action" }
  ];

  isLoading: string[] = [];

  // METHODS
  getButtonConfig(pkg: Package) {
    return getButtonConfig(pkg);
  }
  async installActionHandlerWrapper(event: Event, pkg: Package, handler: Function) {
    this.isLoading.push(pkg.id);
    await handler(event, pkg);
    this.isLoading = this.isLoading.filter(id => id !== pkg.id);
  }
}
</script>

<style lang="scss" scoped></style>
