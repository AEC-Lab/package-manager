<template>
  <div>
    <v-data-table fixed-header height="10%" :headers="headersPackages" :items="packages" :items-per-page="10">
      <template v-slot:item="{ item }">
        <tr>
          <td>{{ item.name }}</td>
          <td>{{ $store.getters["authors/getAuthorNameById"](item.authorId) }}</td>
          <td>{{ Object.keys(PackageSource).find(key => PackageSource[key] === item.source) }}</td>
          <td>
            {{ Object.keys(PackageVisibility).find(key => PackageVisibility[key] === item.visibility) }}
          </td>
          <td>{{ Object.keys(PackageStatus).find(key => PackageStatus[key] === item.status) }}</td>
          <td class="data-table-cell-icon">
            <v-btn
              icon
              @click="
                () => {
                  $router.push(`/packages/${item.id}/edit`);
                }
              "
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>
    <v-btn
      class="mr-4"
      outlined
      @click="
        () => {
          $router.push('/packages/create');
        }
      "
    >
      <v-icon left>mdi-plus-thick</v-icon>
      Create Package
    </v-btn>
    <v-dialog v-model="dialogRequestCode" scrollable max-width="500px" v-if="packages.length">
      <template v-slot:activator="{ on, attrs }">
        <v-btn outlined v-bind="attrs" v-on="on">
          Process Subscription Request Code
        </v-btn>
      </template>
      <v-card>
        <ProcessRequestCodeForm :packages="packages" :closeDialog="closeDialogRequestCode" />
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import ProcessRequestCodeForm from "./ProcessRequestCodeForm.vue";
import { PackageStatus, PackageSource, PackageVisibility } from "../../../types/enums";
import { Package } from "../../../types/package";

@Component({
  components: {
    ProcessRequestCodeForm
  }
})
export default class AdminPackagesTable extends Vue {
  // DATA PROPERTIES
  PackageStatus = PackageStatus;
  PackageSource = PackageSource;
  PackageVisibility = PackageVisibility;

  dialogRequestCode = false;
  requestCode = "";
  requestCodeSelectedPackageIds: string[] = [];

  headersPackages = [
    { text: "Name", value: "name" },
    { text: "Author", value: "author" },
    { text: "Source", value: "source" },
    { text: "Visibility", value: "visibility" },
    { text: "Status", value: "status" },
    { text: "", value: "edit" }
  ];

  // COMPUTED PROPERTIES
  get packages(): Package[] {
    return this.$store.state.packages.packages.filter((pkg: Package) => {
      const packageAdmins = this.$store.getters["packages/getPackageAdmins"](pkg);
      return packageAdmins.includes(this.$store.state.auth.user.githubId);
    });
  }

  // METHODS
  closeDialogRequestCode() {
    this.dialogRequestCode = false;
    this.requestCode = "";
    this.requestCodeSelectedPackageIds = [];
  }

  // LIFECYCLE METHODS
}
</script>
