<template>
  <v-container id="container" class="enterprise-admin">
    <v-row>
      <v-col cols="12">
        <v-form v-model="isFormValid" ref="form" lazy-validation>
          <v-card elevation="4" outlined>
            <v-card-title class="vo-card-title-light">Listing Data</v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <!-- ENTERPRISE NAME -->
              <v-text-field
                label="Enterprise Name"
                v-model="enterpriseTemp.name"
                required
                :rules="nameRules"
              ></v-text-field>
              <br /><br />
              <!-- ENTERPRISE IMAGE LOGO -->
              <v-text-field
                v-model="enterpriseTemp.imageUrl"
                clear-icon="mdi-close"
                clearable
                label="Logo image URL"
                hint="This image will be used as the icon next to this enterprise's sub-section of the marketplace browser"
              ></v-text-field>
              <v-row class="" justify="start">
                <div class="img-wrapper">
                  <img :src="enterpriseTemp.imageUrl" alt="" />
                </div>
              </v-row>
            </v-card-text>
          </v-card>

          <br /><br />

          <!-- PACKAGE SUBSCRIPTIONS -->
          <v-card elevation="4" outlined>
            <v-card-title class="vo-card-title-light">Configuration</v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <!-- ENTERPRISE DOMAINS -->
              <v-combobox
                v-model="enterpriseTemp.memberDomains"
                hide-selected
                hint="Enter one or more email domains (the part of the email address after the '@' character), e.g. 'mycompany.com'"
                label="Member Domains"
                multiple
                persistent-hint
                append-icon=""
                prepend-icon=""
                required
                :rules="domainRules"
              >
                <template v-slot:selection="{ attrs, item, select, selected }">
                  <v-chip
                    v-bind="attrs"
                    :input-value="selected"
                    close
                    @click="select"
                    @click:close="removeDomain(item)"
                  >
                    {{ item }}
                  </v-chip>
                </template>
              </v-combobox>

              <br /><br />

              <v-data-table
                fixed-header
                height="10%"
                :headers="headersPackages"
                :items="packageTableItems"
                :items-per-page="10"
                sort-by="name"
              >
                <template v-slot:top>
                  <v-toolbar flat>
                    <v-toolbar-title
                      >Packages ({{ Object.keys(enterpriseTemp.packageConfig).length }})</v-toolbar-title
                    >
                    <v-spacer></v-spacer>
                    <v-dialog v-model="dialogRequestCode" max-width="500px">
                      <template v-slot:activator="{ on, attrs }">
                        <v-btn
                          text
                          outlined
                          v-bind="attrs"
                          v-on="on"
                          class="mr-4"
                          @click="generateRequestCode"
                        >
                          Generate Request Code
                        </v-btn>
                      </template>
                      <v-card>
                        <v-card-text class="pb-0 pt-4">
                          <v-row class="mx-0">
                            <div class="subtitle-1">Your request code is:</div>
                          </v-row>
                        </v-card-text>
                        <v-card-title>
                          <span v-if="requestCode">{{ requestCode }}</span>
                          <v-progress-circular v-else indeterminate color="primary"></v-progress-circular>
                        </v-card-title>
                        <v-card-text class="pt-4">
                          <v-row class="mx-0">
                            <div class="subtitle-2">
                              Copy/save this code, and send it to an admin for the private package(s) for
                              which you are requesting a subscription.<br /><br />This code will expire after
                              10 days.
                            </div>
                          </v-row>
                        </v-card-text>
                        <v-divider></v-divider>
                        <v-card-actions>
                          <v-btn color="primary" @click="closeDialogRequestCode">
                            Close
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-dialog>
                    <v-dialog v-model="dialogAddPackages" scrollable max-width="500px">
                      <template v-slot:activator="{ on, attrs }">
                        <v-btn text outlined v-bind="attrs" v-on="on">
                          <v-icon left>mdi-plus</v-icon>
                          Add Public Packages
                        </v-btn>
                      </template>
                      <v-card>
                        <v-card-text style="height: 300px;">
                          <v-autocomplete
                            v-model="packagesToAdd"
                            label="Select packages"
                            multiple
                            chips
                            deletable-chips
                            clearable
                            :items="availablePublicPackages"
                            class="mt-4"
                          />
                        </v-card-text>
                        <v-divider></v-divider>
                        <v-card-actions>
                          <v-btn color="primary" text @click="closeDialogPackages">
                            Cancel
                          </v-btn>
                          <v-btn color="primary" @click="addSelectedPackages">
                            Add selected packages
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-dialog>
                  </v-toolbar>
                </template>
                <template v-slot:item="{ item }">
                  <tr>
                    <td>{{ item.name }}</td>
                    <td>
                      {{ item.author }}
                    </td>
                    <td>
                      {{ packageVisibilityEnums.find(([k, v]) => v === item.visibility)[0] }}
                      <v-icon v-if="item.visibility === 'PRIVATE'" small>mdi-lock</v-icon>
                    </td>
                    <td>
                      <v-select
                        v-model="enterpriseTemp.packageConfig[item.id]"
                        @input="val => handlePackageAccessChange(item, val)"
                        :items="packageAccessEnums"
                        hide-details
                        dense
                        outlined
                      ></v-select>
                    </td>
                    <td class="data-table-cell-icon">
                      <ActionIconConfirm
                        icon="mdi-delete"
                        acceptColor="error"
                        :acceptAction="() => removePackage(item.id)"
                      />
                    </td>
                  </tr>
                </template>
              </v-data-table>

              <br /><br />

              <!-- MEMBERS (INTERNAL + EXTERNAL) -->
              <v-data-table
                fixed-header
                height="10%"
                :headers="headersMembers"
                :items="memberTableItems"
                :items-per-page="10"
                sort-by="name"
                :expanded.sync="membersExpanded"
                single-expand
                show-expand
              >
                <template v-slot:top>
                  <v-toolbar flat>
                    <v-toolbar-title
                      >Members ({{
                        $store.getters["users/getUsersByDomains"](enterpriseTemp.memberDomains).length +
                          enterpriseTemp.externalMembers.length
                      }})</v-toolbar-title
                    >
                    <v-spacer></v-spacer>
                    <v-dialog v-model="dialogAddMembers" scrollable max-width="500px">
                      <template v-slot:activator="{ on, attrs }">
                        <v-btn text outlined v-bind="attrs" v-on="on">
                          <v-icon left>mdi-plus</v-icon>
                          Add External Members
                        </v-btn>
                      </template>
                      <v-card>
                        <v-card-text style="max-height: 300px; min-height: 150px;">
                          <v-form v-model="isEmailFormValid" ref="formEmails" lazy-validation>
                            <v-combobox
                              v-model="membersToAdd"
                              hide-selected
                              hint="Enter one or more valid email addresses; hit the 'ENTER' key after each"
                              label="External member emails"
                              multiple
                              append-icon=""
                              prepend-icon=""
                              :delimiters="[' ', ',']"
                              :search-input.sync="emailInput"
                              @update:search-input="processEmailInput"
                              :rules="emailRules"
                              class="mt-4"
                            >
                              <template v-slot:selection="{ attrs, item, select, selected }">
                                <v-chip
                                  v-bind="attrs"
                                  :input-value="selected"
                                  close
                                  @click="select"
                                  @click:close="removeEmail(item)"
                                >
                                  {{ item }}
                                </v-chip>
                              </template>
                            </v-combobox>
                          </v-form>
                        </v-card-text>
                        <v-divider></v-divider>
                        <v-card-actions>
                          <v-btn color="primary" text @click="closeDialogMembers">
                            Cancel
                          </v-btn>
                          <v-btn color="primary" @click="addSelectedEmails">
                            Add members
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-dialog>
                  </v-toolbar>
                </template>
                <template v-slot:item="{ item, expand, isExpanded }">
                  <tr>
                    <td>
                      <v-icon v-if="!item.isExternal" color="primary">mdi-account-check</v-icon>
                      <v-icon v-if="item.isAdmin" color="primary">mdi-shield-account</v-icon>
                    </td>
                    <td>{{ item.name }}</td>
                    <td>
                      {{ item.email }}
                    </td>
                    <td>
                      <v-select
                        v-model="item.access"
                        @input="val => handleMemberAccessChange(item, val)"
                        :items="packageAccessEnums"
                        hide-details
                        dense
                        outlined
                      ></v-select>
                    </td>
                    <td class="data-table-cell-icon">
                      <ActionIconConfirm
                        v-if="item.isExternal"
                        icon="mdi-delete"
                        acceptColor="error"
                        :acceptAction="() => removeExternalMember(item.email)"
                      />
                    </td>
                    <td class="data-table-cell-icon">
                      <v-btn v-if="item.access === 'CUSTOM'" icon @click="expand(!isExpanded)">
                        <v-icon>{{ isExpanded ? "mdi-chevron-up" : "mdi-chevron-down" }}</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </template>
                <template v-slot:expanded-item="{ headers, item }">
                  <td
                    v-if="item.access === 'CUSTOM'"
                    :colspan="headers.length"
                    class="table-expanded-content"
                  >
                    <v-row class="ml-0">
                      <v-col>
                        <v-switch
                          v-for="pkg in packageTableItemsCustomAccess"
                          :key="pkg.id"
                          :label="`${pkg.name} (${pkg.author})`"
                          multiple
                          v-model="enterpriseTemp.memberConfig[item.email]"
                          :value="pkg.id"
                          dense
                          hide-details
                        />
                      </v-col>
                    </v-row>
                  </td>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>

          <br /><br />

          <v-btn class="mr-4" @click="() => $router.push('/admin')">Cancel</v-btn>
          <v-btn class="mr-4" @click="save" color="primary" :loading="processingSave">Save</v-btn>
          <v-btn @click="deleteEnterprise" color="error" :loading="processingDelete">Delete</v-btn>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import _ from "lodash";

import { Enterprise } from "../../../types/enterprise";
import { Package } from "../../../types/package";
import { User } from "../../../types/auth";
import { EnterprisePackageAccess, PackageStatus, PackageVisibility } from "../../../types/enums";
import { isValidDomain, isValidEmail } from "../../utils/helpers";
import { fireFunc } from "../../integrations/firebase";
import ActionIconConfirm from "../../components/ActionIconConfirm.vue";

interface PackageSelect {
  text: string;
  value: string;
}

@Component({
  components: {
    ActionIconConfirm
  }
})
export default class EnterpriseEdit extends Vue {
  // DATA PROPERTIES
  packageAccessEnums = Object.entries(EnterprisePackageAccess).map(([key, value]) => {
    return {
      text: key,
      value: value
    };
  });
  packageVisibilityEnums = Object.entries(PackageVisibility);

  enterpriseTemp: Enterprise = this.defaultEnterpriseData();

  headersPackages = [
    { text: "Name", value: "name" },
    { text: "Author", value: "author" },
    { text: "Visibility", value: "visibility" },
    { text: "Access", value: "access", width: 180 },
    { text: "", value: "actions", sortable: false, align: "center", width: 105 }
  ];
  headersMembers = [
    { text: "", value: "accountIcons", width: 105 },
    { text: "Name", value: "name" },
    { text: "Email", value: "email" },
    { text: "Access", value: "access", width: 180 },
    { text: "", value: "actions", sortable: false, align: "center", width: 105 },
    { text: "", value: "data-table-expand", sortable: false, width: 70 }
  ];

  nameRules = [(v: string) => !!v || "Field is required"];
  domainRules = [
    (vals: string[]) => vals.length > 0 || "At least one domain is required",
    (vals: string[]) => vals.every(v => isValidDomain(v)) || "Invalid domain(s)"
  ];
  emailRules = [
    (vals: string[]) => vals.length > 0 || "Must include at least one valid email",
    (vals: string[]) => vals.every(v => isValidEmail(v)) || "Invalid email(s)"
  ];

  packagesToAdd: string[] = [];
  membersToAdd: string[] = [];
  emailInput = "";
  membersExpanded: any[] = [];

  isFormValid = false;
  isEmailFormValid = false;
  requestCode: string | null = null;
  dialogRequestCode = false;
  dialogAddPackages = false;
  dialogAddMembers = false;
  processingSave = false;
  processingDelete = false;

  // COMPUTED PROPERTIES
  get packageTableItems() {
    const items = Object.entries(this.enterpriseTemp.packageConfig)
      .map(([pkgId, val]: [string, EnterprisePackageAccess]) => {
        const pkg: Package = this.$store.getters["packages/getPackageById"](pkgId);
        return {
          id: pkgId,
          name: pkg.name,
          author: this.$store.getters["authors/getAuthorNameById"](pkg.authorId),
          visibility: pkg.visibility,
          access: val,
          status: pkg.status
        };
      })
      .filter(pkg => pkg.status === PackageStatus.Active);
    return _.orderBy(items, ["name", "author"]);
  }

  get packageTableItemsCustomAccess() {
    return this.packageTableItems.filter(pkg => pkg.access === EnterprisePackageAccess.Custom);
  }

  get memberTableItems() {
    const domainMembers: User[] = this.$store.getters["users/getUsersByDomains"](
      this.enterpriseTemp.memberDomains
    );
    const externalMembers: User[] = [];
    for (const email of this.enterpriseTemp.externalMembers) {
      const user = this.$store.getters["users/getUserByEmail"](email);
      if (user) {
        externalMembers.push(user);
      } else {
        externalMembers.push({
          name: null,
          roles: [],
          uid: "",
          config: [],
          email
        });
      }
    }
    const allMembers = domainMembers.concat(externalMembers);
    return allMembers.map(user => {
      return {
        id: user.uid,
        name: user.name,
        email: user.email,
        access:
          user.email! in this.enterpriseTemp.memberConfig
            ? EnterprisePackageAccess.Custom
            : EnterprisePackageAccess.Default,
        isExternal: !this.enterpriseTemp.memberDomains.includes(user.email!.split("@")[1]),
        isAdmin: this.enterpriseTemp.admins?.includes(user.uid)
      };
    });
  }

  get availablePublicPackages(): PackageSelect[] {
    return this.$store.state.packages.packages
      .filter((pkg: Package) => pkg.visibility === PackageVisibility.Public)
      .filter((pkg: Package) => !(pkg.id in this.enterpriseTemp.packageConfig))
      .map((pkg: Package) => {
        return {
          text: `${pkg.name} (${this.$store.getters["authors/getAuthorNameById"](pkg.authorId)})`,
          value: pkg.id
        };
      })
      .sort((a: PackageSelect, b: PackageSelect) => (a.text > b.text ? 1 : -1));
  }

  // METHODS
  removeDomain(item: string) {
    this.enterpriseTemp.memberDomains = this.enterpriseTemp.memberDomains.filter(domain => domain !== item);
  }

  removePackage(packageId: string) {
    const pkgConfig = { ...this.enterpriseTemp.packageConfig };
    delete pkgConfig[packageId];
    this.enterpriseTemp.packageConfig = pkgConfig;
    // also remove package id from any memberConfig array (if it was set to Custom access)
    this.removePackageIdFromMemberConfig(packageId);
  }

  async generateRequestCode() {
    const requestCode = await (
      await fireFunc.httpsCallable("generateRequestCode")({ enterpriseId: this.enterpriseTemp.id })
    ).data;
    if (!requestCode) this.$snackbar.flash({ content: "Unable to create request code", color: "error" });
    this.requestCode = requestCode;
  }

  closeDialogRequestCode() {
    this.dialogRequestCode = false;
    this.requestCode = null;
  }

  addSelectedPackages() {
    for (const pkgId of this.packagesToAdd) {
      this.$set(this.enterpriseTemp.packageConfig, pkgId, EnterprisePackageAccess.Default);
    }
    this.closeDialogPackages();
  }

  closeDialogPackages() {
    this.dialogAddPackages = false;
    this.packagesToAdd = [];
  }

  removeExternalMember(email: string) {
    this.enterpriseTemp.externalMembers = this.enterpriseTemp.externalMembers.filter(mem => mem !== email);
  }

  removeEmail(email: string) {
    this.membersToAdd = this.membersToAdd.filter(item => item !== email);
  }

  processEmailInput(text: string) {
    if (!text) return;
    const splitItems = text.split(/[ ,]/).filter(Boolean);
    if (!(splitItems.length > 1)) return;
    this.membersToAdd = this.membersToAdd.concat(
      splitItems.filter(item => !this.membersToAdd.includes(item))
    );
    this.emailInput = "";
  }

  addSelectedEmails() {
    const isValid = (this.$refs.formEmails as Vue & {
      validate: () => boolean;
    }).validate();
    if (!isValid) return;

    for (const email of this.membersToAdd) {
      if (this.enterpriseTemp.memberDomains.includes(email.split("@")[1])) continue;
      this.enterpriseTemp.externalMembers.push(email);
    }
    this.closeDialogMembers();
  }

  closeDialogMembers() {
    this.dialogAddMembers = false;
    this.membersToAdd = [];
  }

  handleMemberAccessChange(item: any, val: EnterprisePackageAccess) {
    const memberConfig = { ...this.enterpriseTemp.memberConfig };
    if (val === EnterprisePackageAccess.Default) {
      delete memberConfig[item.email];
      this.enterpriseTemp.memberConfig = memberConfig;
    } else {
      memberConfig[item.email] = [];
    }
    this.enterpriseTemp.memberConfig = memberConfig;
  }

  handlePackageAccessChange(item: any, val: EnterprisePackageAccess) {
    if (val === EnterprisePackageAccess.Default) {
      this.removePackageIdFromMemberConfig(item.id);
    }
  }

  removePackageIdFromMemberConfig(packageId: string) {
    for (const memberId in this.enterpriseTemp.memberConfig) {
      if (Array.isArray(this.enterpriseTemp.memberConfig[memberId])) {
        this.enterpriseTemp.memberConfig[memberId] = this.enterpriseTemp.memberConfig[memberId].filter(
          pkgId => pkgId !== packageId
        );
      }
    }
  }

  defaultEnterpriseData(): Enterprise {
    return {
      id: "",
      name: "",
      memberDomains: [],
      externalMembers: [],
      packageConfig: {},
      memberConfig: {},
      imageUrl: "",
      admins: []
    };
  }

  async save() {
    const isValid = (this.$refs.form as Vue & {
      validate: () => boolean;
    }).validate();
    if (!isValid) return;

    const payload = this.enterpriseTemp;

    try {
      this.processingSave = true;
      const isSuccess = await this.$store.dispatch("enterprises/updateEnterpriseData", payload);
      if (isSuccess) this.$router.push("/admin");
      else this.processingSave = false;
    } catch (error) {
      this.$snackbar.flash({ content: error, color: "error" });
      this.processingSave = false;
      console.log(error);
    }
  }

  async deleteEnterprise() {
    const response = await this.$confirm(
      "Are you sure you want to delete this Enterprise? This action cannot be undone.",
      {
        title: "Delete Enterprise",
        buttonTrueText: "Delete",
        buttonFalseText: "Cancel",
        color: "error",
        buttonTrueColor: "error",
        icon: ""
      }
    );
    if (response) {
      try {
        this.processingDelete = true;
        const isSuccess = await this.$store.dispatch("enterprises/deleteEnterprise", this.enterpriseTemp.id);
        if (isSuccess) this.$router.push("/admin");
        else this.processingDelete = false;
      } catch (error) {
        this.$snackbar.flash({ content: error, color: "error" });
        this.processingDelete = false;
        console.log(error);
      }
    }
  }

  // LIFECYCLE HOOKS
  mounted() {
    const enterpriseRef: Enterprise = this.$store.state.enterprises.enterprises.find(
      (enterprise: Enterprise) => enterprise.id === this.$route.params.enterpriseId
    );
    this.enterpriseTemp = _.cloneDeep(enterpriseRef);
  }
}
</script>

<style lang="scss">
.enterprise-admin {
  .v-input--selection-controls {
    margin-top: 0;
  }
}
</style>

<style lang="scss" scoped>
#container {
  background-color: rgb(255, 255, 255);
  height: 100%;
  max-width: 100%;
  padding: 20px;
  position: absolute;
  overflow: auto;
}

img {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.img-wrapper {
  height: 80px;
  &:not(:last-child) {
    margin-right: 8px;
  }
}
</style>
