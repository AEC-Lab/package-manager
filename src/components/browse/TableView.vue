<template>
  <div id="table-view">
    <v-data-table
      v-for="enterpriseArray in packagesByEnterprise"
      :key="enterpriseArray[0].id"
      fixed-header
      height="10%"
      :headers="headers"
      :items="enterpriseArray[1]"
      :items-per-page="10"
      class="elevation-1 mb-8"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title class="primary--text">
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
          </v-toolbar-title>
        </v-toolbar>
      </template>
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
              dark
              @click="e => installActionHandlerWrapper(e, item, getButtonConfig(item).handler)"
            >
              <template v-slot:loader>
                <v-progress-linear
                  v-model="progressValue"
                  color="accent"
                  absolute
                  bottom
                  rounded
                  height="100%"
                  :indeterminate="isIndeterminate.includes(item.id)"
                >
                </v-progress-linear>
              </template>
              {{ getButtonConfig(item).text }}
            </v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>
    <v-data-table
      fixed-header
      height="10%"
      :headers="headers"
      :items="packagesPublic"
      :items-per-page="10"
      class="elevation-1"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title class="primary--text">Public</v-toolbar-title>
        </v-toolbar>
      </template>
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
              dark
              @click="e => installActionHandlerWrapper(e, item, getButtonConfig(item).handler)"
            >
              <template v-slot:loader>
                <v-progress-linear
                  v-model="progressValue"
                  color="accent"
                  absolute
                  bottom
                  rounded
                  height="100%"
                  :indeterminate="isIndeterminate.includes(item.id)"
                >
                </v-progress-linear>
              </template>
              {{ getButtonConfig(item).text }}
            </v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { ipcRenderer } from "electron";
import { Package } from "../../../types/package";
import { Enterprise } from "../../../types/enterprise";
import { Vue, Component, Prop } from "vue-property-decorator";
import { getButtonConfig } from "../../utils/install";

@Component({
  name: "TableView"
})
export default class TableView extends Vue {
  @Prop() readonly packages!: Package[];
  @Prop() readonly packagesPublic!: Package[];
  @Prop() readonly packagesByEnterprise!: [Enterprise, Package[]][];
  @Prop() readonly showDetails!: (pkg: Package) => void;

  // DATA PROPERTIES
  headers = [
    { text: "Tool Name", value: "toolName" },
    { text: "Description", value: "description" },
    { text: "Author", value: "author" },
    { text: "Action", value: "action", align: "center", width: 150 }
  ];

  isLoading: string[] = [];
  isIndeterminate: string[] = [];
  progressValue = 0;

  // METHODS
  getButtonConfig(pkg: Package) {
    return getButtonConfig(pkg);
  }
  async installActionHandlerWrapper(event: Event, pkg: Package, handler: Function) {
    this.isLoading.push(pkg.id);
    this.isIndeterminate.push(pkg.id);

    ipcRenderer.on("download-total", (_event, dlTotalBytes) => {
      if (dlTotalBytes > 2000000) {
        this.isIndeterminate.forEach(pkgId => {
          if (pkgId === pkg.id) this.isIndeterminate.splice(this.isIndeterminate.indexOf(pkgId));
        });
      }
    });
    ipcRenderer.on("download-progress", (_event, dlPercent) => {
      this.progressValue = dlPercent * 100;
    });

    await handler(event, pkg);
    this.isIndeterminate.splice(this.isIndeterminate.indexOf(pkg.id));
    this.isLoading = this.isLoading.filter(id => id !== pkg.id);
  }
}
</script>

<style lang="scss">
#table-view {
  .enterprise-logo {
    .v-image__image--contain {
      background-position: left center !important;
    }
  }
}
</style>
