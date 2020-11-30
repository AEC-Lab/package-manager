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
          <v-btn small block @click="e => e.stopPropagation()">Install</v-btn>
        </td>
      </tr>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { Repository } from "../../../types/repos";

@Component({
  name: "TableView"
})
export default class TableView extends Vue {
  @Prop() readonly repos!: Repository[];
  @Prop() readonly showDetails!: (repo: Repository) => void;

  headers = [
    { text: "Tool Name", value: "toolName" },
    { text: "Description", value: "description" },
    { text: "Version", value: "version" },
    { text: "Action", value: "action" }
  ];

  get repoDescription() {
    return (id: number) => {
      return this.$store.state.github.repositories.find(r => r.id === id)?.description;
    };
  }
}
</script>

<style lang="scss" scoped></style>
