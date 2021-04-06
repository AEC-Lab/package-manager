<template>
  <v-container id="container">
    <v-row>
      <v-col cols="12">
        <v-form v-model="isFormValid" ref="form" lazy-validation>
          <v-text-field label="Enterprise Name" v-model="name" required :rules="nameRules"></v-text-field>
          <v-combobox
            v-model="memberDomains"
            hide-selected
            hint="Enter one or more email domains (the part of the email address after the '@' character), e.g. 'mycompany.com'"
            label="Member Domains"
            multiple
            persistent-hint
            append-icon=""
            prepend-icon=""
            required
            :delimiters="[' ', ',']"
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
          <v-autocomplete
            v-model="initialPackages"
            chips
            deletable-chips
            multiple
            label="Packages"
            :search-input.sync="packageSearch"
            :items="packages"
            hint="You can add to or edit this list at any time"
            persistent-hint
          ></v-autocomplete>
          <v-combobox
            v-model="externalMembers"
            hide-selected
            hint="You can add to or edit this list at any time"
            label="External member emails"
            multiple
            persistent-hint
            append-icon=""
            prepend-icon=""
            :delimiters="[' ', ',']"
            :rules="emailRules"
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
          <v-text-field
            v-model="imageUrl"
            clear-icon="mdi-close"
            clearable
            label="Add an image URL"
            hint="This image will be used as the icon next to this enterprise's sub-section of the marketplace browser"
          ></v-text-field>
          <v-row class="" justify="start">
            <div class="img-wrapper">
              <img :src="imageUrl" alt="" />
            </div>
          </v-row>
          <v-btn class="mr-4" @click="() => $router.push('/admin')">Cancel</v-btn>
          <v-btn @click="create" color="primary" :loading="processing">Create</v-btn>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Enterprise } from "../../../types/enterprise";
import { EnterprisePackageAccess, PackageVisibility } from "../../../types/enums";
import { Package } from "../../../types/package";
import { isValidDomain, isValidEmail } from "../../utils/helpers";

interface PackageSelect {
  text: string;
  value: string;
}

@Component
export default class EnterpriseCreate extends Vue {
  // DATA PROPERTIES
  name = "";
  memberDomains = [];
  externalMembers = [];
  initialPackages: string[] = [];
  packageSearch: string | null = null;

  imageUrl = "";

  nameRules = [(v: string) => !!v || "Field is required"];

  domainRules = [
    (vals: string[]) => vals.length > 0 || "At least one domain is required",
    (vals: string[]) => vals.every(v => isValidDomain(v)) || "Invalid domain(s)"
  ];

  emailRules = [(vals: string[]) => vals.every(v => isValidEmail(v)) || "Invalid email(s)"];

  isFormValid = false;

  processing = false;

  // COMPUTED PROPERTIES
  get packages(): PackageSelect[] {
    return this.$store.state.packages.packages
      .filter((pkg: Package) => pkg.visibility === PackageVisibility.Public)
      .map((pkg: Package) => {
        return {
          text: `${pkg.name} (${this.$store.getters["authors/getAuthorNameById"](pkg.authorId)})`,
          value: pkg.id
        };
      });
  }

  // METHODS
  removeDomain(item: string) {
    this.memberDomains = this.memberDomains.filter(domain => domain !== item);
  }

  removeEmail(item: string) {
    this.externalMembers = this.externalMembers.filter(email => email !== item);
  }

  async create() {
    const isValid = (this.$refs.form as Vue & {
      validate: () => boolean;
    }).validate();
    if (!isValid) return;

    const payload: Enterprise = {
      id: "",
      name: this.name,
      memberDomains: this.memberDomains,
      externalMembers: this.externalMembers,
      packageConfig: Object.fromEntries(
        this.initialPackages.map(pkgId => [pkgId, EnterprisePackageAccess.Default])
      ),
      memberConfig: {},
      imageUrl: this.imageUrl,
      admins: []
    };

    try {
      this.processing = true;
      const isSuccess = await this.$store.dispatch("enterprises/createEnterprise", payload);
      if (isSuccess) this.$router.push("/admin");
      else this.processing = false;
    } catch (error) {
      this.$snackbar.flash({ content: error, color: "error" });
      this.processing = false;
      console.log(error);
    }
  }
}
</script>

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
