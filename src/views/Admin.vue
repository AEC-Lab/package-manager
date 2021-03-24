<template>
  <v-container class="vo-container">
    <v-expansion-panels v-model="panels">
      <v-expansion-panel>
        <v-expansion-panel-header>
          <span class="voyansi-font-title">Packages</span>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <AdminPackagesTable />
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          <span class="voyansi-font-title">Authors</span>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <AdminAuthorsTable />
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel v-if="isUserAdmin">
        <v-expansion-panel-header>
          <span class="voyansi-font-title">Enterprises</span>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <AdminEnterprisesTable />
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel v-if="isUserSuperAdmin">
        <v-expansion-panel-header>
          <span class="voyansi-font-title">Users</span>
        </v-expansion-panel-header>
        <v-expansion-panel-content eager>
          <AdminUsersTable />
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import ActionIconConfirm from "../components/ActionIconConfirm.vue";
import AdminPackagesTable from "../components/admin/AdminPackagesTable.vue";
import AdminAuthorsTable from "../components/admin/AdminAuthorsTable.vue";
import AdminEnterprisesTable from "../components/admin/AdminEnterprisesTable.vue";
import AdminUsersTable from "../components/admin/AdminUsersTable.vue";

@Component({
  components: {
    ActionIconConfirm,
    AdminPackagesTable,
    AdminAuthorsTable,
    AdminEnterprisesTable,
    AdminUsersTable
  }
})
export default class Admin extends Vue {
  // DATA PROPERTIES
  panels = 0;

  // COMPUTED PROPERTIES
  get isUserAdmin() {
    return this.$store.getters["auth/isAdmin"];
  }

  get isUserSuperAdmin() {
    return this.$store.getters["auth/isSuperAdmin"];
  }
}
</script>

<style lang="scss" scoped></style>
