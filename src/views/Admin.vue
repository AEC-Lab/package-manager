<template>
  <v-container class="vo-container">
    <v-expansion-panels v-model="panels">
      <v-expansion-panel>
        <v-expansion-panel-header>
          <span class="voyansi-font-title">Packages</span>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-data-table
            fixed-header
            height="10%"
            :headers="headersPackages"
            :items="packages"
            :items-per-page="10"
          >
            <template v-slot:item="{ item }">
              <tr>
                <td>{{ item.name }}</td>
                <td>{{ $store.getters["authors/getAuthorNameById"](item.authorId) }}</td>
                <td>{{ Object.keys(PackageSource).find(key => PackageSource[key] === item.source) }}</td>
                <td>
                  {{ Object.keys(PackageVisibility).find(key => PackageVisibility[key] === item.visibility) }}
                </td>
                <td>{{ Object.keys(PackageStatus).find(key => PackageStatus[key] === item.status) }}</td>
                <td>
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
        </v-expansion-panel-content>
      </v-expansion-panel>
      <!-- <v-expansion-panel>
        <v-expansion-panel-header>
          <span class="voyansi-font-title">Users</span>
        </v-expansion-panel-header>
      </v-expansion-panel> -->
      <v-expansion-panel>
        <v-expansion-panel-header>
          <span class="voyansi-font-title">Authors</span>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-data-table
            fixed-header
            height="10%"
            :headers="headersAuthors"
            :items="authors"
            :items-per-page="10"
          >
            <template v-slot:item="{ item }">
              <tr>
                <td>{{ item.name }}</td>
                <td>
                  <v-chip-group>
                    <v-chip v-for="source in authorSources(item)" :key="source">{{ source }}</v-chip>
                  </v-chip-group>
                </td>
                <td>{{ authorPackageCount(item) }}</td>
                <td>
                  <v-btn
                    icon
                    @click="
                      () => {
                        $router.push(`/authors/${item.id}/edit`);
                      }
                    "
                  >
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel v-if="isUserAdmin">
        <v-expansion-panel-header>
          <span class="voyansi-font-title">Enterprises</span>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-data-table
            fixed-header
            height="10%"
            :headers="headersEnterprises"
            :items="enterprises"
            :items-per-page="10"
          >
            <template v-slot:item="{ item }">
              <tr>
                <td>{{ item.name }}</td>
                <td>
                  {{
                    $store.getters["users/getUsersByDomains"](item.memberDomains).length +
                      item.externalMembers.length
                  }}
                </td>
                <td>{{ Object.keys(item.packageConfig).length }}</td>
                <td>
                  <v-btn
                    icon
                    @click="
                      () => {
                        $router.push(`/enterprises/${item.id}/edit`);
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
            outlined
            @click="
              () => {
                $router.push('/enterprises/create');
              }
            "
          >
            <v-icon left>mdi-plus-thick</v-icon>
            Create Enterprise
          </v-btn>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { shell } from "electron";
import { PackageStatus, PackageSource, PackageVisibility } from "../../types/enums";
import { Author } from "../../types/author";
import { Package } from "../../types/package";
import { Enterprise } from "../../types/enterprise";
import ProcessRequestCodeForm from "../components/admin/ProcessRequestCodeForm.vue";

@Component({
  components: {
    ProcessRequestCodeForm
  }
})
export default class Admin extends Vue {
  // DATA PROPERTIES
  PackageStatus = PackageStatus;
  PackageSource = PackageSource;
  PackageVisibility = PackageVisibility;

  panels = 0;
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

  headersAuthors = [
    { text: "Name", value: "name" },
    { text: "Sources", value: "sources" },
    { text: "Packages", value: "packageCount" },
    { text: "", value: "edit" }
  ];

  headersEnterprises = [
    { text: "Name", value: "name" },
    { text: "Members", value: "memberCount" },
    { text: "Packages", value: "packageCount" },
    { text: "", value: "edit" }
  ];

  // COMPUTED PROPERTIES
  get packages(): Package[] {
    return this.$store.state.packages.packages.filter((pkg: Package) => {
      const packageAdmins = this.$store.getters["packages/getPackageAdmins"](pkg);
      return packageAdmins.includes(this.$store.state.auth.user.githubId);
    });
  }

  get authors(): Author[] {
    return this.$store.state.authors.authors.filter((author: Author) => {
      const authorAdmins = this.$store.getters["authors/getAuthorAdmins"](author.id);
      return authorAdmins.includes(this.$store.state.auth.user.githubId);
    });
  }

  get enterprises(): Enterprise[] {
    return this.$store.state.enterprises.enterprises;
  }

  get isUserAdmin() {
    return this.$store.getters["auth/isAdmin"];
  }

  // METHOD
  authorSources(author: Author) {
    const sources: string[] = [];
    if (author.sourceConfig.github) {
      sources.push(
        "Github"
        // Object.keys(PackageSource).find((key: string) => (PackageSource as any)[key] === PackageSource.Github)
      );
    }
    return sources;
  }

  authorPackageCount(author: Author) {
    return this.$store.state.packages.packages.filter((pkg: Package) => pkg.authorId === author.id).length;
  }

  editEnterprise() {
    shell.openExternal("https://tinyurl.com/zuw2r2r7");
  }

  closeDialogRequestCode() {
    this.dialogRequestCode = false;
    this.requestCode = "";
    this.requestCodeSelectedPackageIds = [];
  }
}
</script>

<style lang="scss" scoped></style>
