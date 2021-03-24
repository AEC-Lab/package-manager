<template>
  <div>
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
          <td class="data-table-cell-icon">
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
      v-if="isUserSuperAdmin"
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
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Enterprise } from "../../../types/enterprise";

@Component
export default class AdminEnterprisesTable extends Vue {
  // DATA PROPERTIES

  headersEnterprises = [
    { text: "Name", value: "name" },
    { text: "Members", value: "memberCount" },
    { text: "Packages", value: "packageCount" },
    { text: "", value: "edit" }
  ];

  // COMPUTED PROPERTIES
  get enterprises(): Enterprise[] {
    return this.$store.state.enterprises.enterprises.filter((enterprise: Enterprise) => {
      return this.isUserSuperAdmin || enterprise.admins.includes(this.$store.state.auth.user.uid);
    });
  }

  get isUserSuperAdmin() {
    return this.$store.getters["auth/isSuperAdmin"];
  }

  // METHODS
  // LIFECYCLE METHODS
}
</script>
