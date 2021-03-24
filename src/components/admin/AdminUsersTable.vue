<template>
  <v-data-table
    fixed-header
    height="10%"
    :headers="headersUsers"
    :items="users"
    :items-per-page="10"
    sort-by="name"
  >
    <template v-slot:item="{ item }">
      <tr>
        <td>
          <v-icon v-for="provider in userAuthProviders(item)" :key="provider" color="black">
            {{ `mdi-${getProviderIconName(provider)}` }}
          </v-icon>
        </td>
        <td>{{ item.name }}</td>
        <td>{{ item.email }}</td>
        <td>
          <v-checkbox
            v-if="tempUserEdit && tempUserEdit.uid === item.uid"
            :value="UserRole.User"
            v-model="tempUserEdit.roles"
          />
          <v-checkbox v-else disabled readonly :value="UserRole.User" v-model="item.roles" />
        </td>
        <td>
          <v-checkbox
            v-if="tempUserEdit && tempUserEdit.uid === item.uid"
            :value="UserRole.Admin"
            v-model="tempUserEdit.roles"
          />
          <v-checkbox v-else disabled readonly :value="UserRole.Admin" v-model="item.roles" />
        </td>
        <td>
          <v-checkbox
            v-if="tempUserEdit && tempUserEdit.uid === item.uid"
            :value="UserRole.SuperAdmin"
            v-model="tempUserEdit.roles"
          />
          <v-checkbox v-else disabled readonly :value="UserRole.SuperAdmin" v-model="item.roles" />
        </td>
        <td style="text-align: center;">
          <v-select
            v-if="
              tempUserEdit && tempUserEdit.uid === item.uid && tempUserEdit.roles.includes(UserRole.Admin)
            "
            :items="enterprises"
            item-text="name"
            item-value="id"
            v-model="tempAdminEnterprises"
            label="Select item(s)"
            multiple
          >
            <template v-slot:selection="{ item, index }">
              <v-chip v-if="index === 0">
                <span>{{ item.name }}</span>
              </v-chip>
              <span v-if="index === 1" class="grey--text caption">
                (+{{ tempAdminEnterprises.length - 1 }} others)
              </span>
            </template>
          </v-select>
          <span v-else>{{ adminEnterpriseCount(item) || "-" }}</span>
        </td>
        <td class="data-table-cell-icon">
          <ActionIconConfirm
            icon="mdi-pencil"
            acceptColor="success"
            :disabled="Boolean(tempUserEdit)"
            :initAction="() => userEditInit(item)"
            :cancelAction="userEditCancel"
            :acceptAction="userEditAccept"
          />
        </td>
      </tr>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { fireFunc } from "../../integrations/firebase";
import ActionIconConfirm from "../ActionIconConfirm.vue";
import { UserRole } from "../../../types/enums";
import { User } from "../../../types/auth";
import { Enterprise } from "../../../types/enterprise";
import { getEmailDomain } from "../../utils/helpers";

interface UserAuthRecord {
  uid: string;
  providers: string[];
}

@Component({
  components: {
    ActionIconConfirm
  }
})
export default class AdminUsersTable extends Vue {
  // DATA PROPERTIES
  UserRole = UserRole;

  userAuthRecords: UserAuthRecord[] = [];

  tempUserEdit: User | null = null;
  tempAdminEnterprises: string[] = [];

  headersUsers = [
    { text: "Providers", value: "providers", sortable: false },
    { text: "Name", value: "name" },
    { text: "Email", value: "email" },
    // { text: "Roles", value: "roles" },
    { text: "User", value: "roleUser", width: 70 },
    { text: "Admin", value: "roleAdmin", width: 70 },
    { text: "Super Admin", value: "roleSuperAdmin", width: 70 },
    { text: "Enterprises", value: "enterprises" },
    { text: "", value: "edit", sortable: false, align: "center", width: 105 }
  ];

  // COMPUTED PROPERTIES
  get users(): User[] {
    return this.$store.state.users.users;
  }

  get enterprises(): Enterprise[] {
    return this.$store.state.enterprises.enterprises;
  }

  get isUserSuperAdmin() {
    return this.$store.getters["auth/isSuperAdmin"];
  }

  // METHODS
  userAuthProviders(user: User) {
    return this.userAuthRecords.find(record => record.uid === user.uid)?.providers || [];
  }

  getProviderIconName(providerId: string) {
    switch (providerId) {
      case "google.com":
        return "google";
      case "github.com":
        return "github";
      case "password":
        return "email";
    }
  }

  adminEnterpriseCount(user: User) {
    return this.enterprises.filter(enterprise => enterprise.admins?.includes(user.uid)).length;
  }

  userEditInit(user: User) {
    this.tempUserEdit = { ...user };
    this.tempAdminEnterprises = this.enterprises
      .filter(enterprise => enterprise.admins?.includes(user.uid))
      .map(enterprise => enterprise.id);
  }

  userEditCancel() {
    this.tempUserEdit = null;
    this.tempAdminEnterprises = [];
  }

  async userEditAccept() {
    try {
      // Update user's roles
      await this.$store.dispatch("users/updateUserRoles", this.tempUserEdit);

      // Update enterprise
      const enterpriseUpdates = [];
      const enterprisesAdded = this.enterprises.filter(
        ent => !ent.admins?.includes(this.tempUserEdit!.uid) && this.tempAdminEnterprises.includes(ent.id)
      );
      const enterprisesRemoved = this.enterprises.filter(
        ent => ent.admins?.includes(this.tempUserEdit!.uid) && !this.tempAdminEnterprises.includes(ent.id)
      );
      for (const enterprise of enterprisesAdded) {
        const updatedEnterpriseData = { ...enterprise } as Enterprise;
        // push user's uid onto admins array
        if (!updatedEnterpriseData.admins) {
          updatedEnterpriseData.admins = [this.tempUserEdit!.uid];
        } else {
          updatedEnterpriseData.admins.push(this.tempUserEdit!.uid);
        }
        // add user's email to external member array (if not already included), if the domain does not match memberDomains
        if (
          this.tempUserEdit!.email &&
          !updatedEnterpriseData.memberDomains.includes(getEmailDomain(this.tempUserEdit!.email)) &&
          !updatedEnterpriseData.externalMembers.includes(this.tempUserEdit!.email)
        ) {
          updatedEnterpriseData.externalMembers.push(this.tempUserEdit!.email);
        }
        enterpriseUpdates.push(
          this.$store.dispatch("enterprises/updateEnterpriseData", updatedEnterpriseData)
        );
      }
      for (const enterprise of enterprisesRemoved) {
        const updatedEnterpriseData = { ...enterprise } as Enterprise;
        updatedEnterpriseData.admins = updatedEnterpriseData.admins.filter(
          id => id !== this.tempUserEdit!.uid
        );
        enterpriseUpdates.push(
          this.$store.dispatch("enterprises/updateEnterpriseData", updatedEnterpriseData)
        );
      }

      await Promise.all(enterpriseUpdates);

      this.tempUserEdit = null;
      this.tempAdminEnterprises = [];
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // LIFECYCLE METHODS
  async mounted() {
    if (this.isUserSuperAdmin) {
      this.userAuthRecords = await (await fireFunc.httpsCallable("getAuthUsers")()).data;
    }
  }
}
</script>
