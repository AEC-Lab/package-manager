<template>
  <v-container id="container">
    <v-row>
      <v-col cols="12">
        <v-card elevation="4" outlined>
          <v-card-title class="vo-card-title-light">Listing Information</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-text-field label="Name" v-model="packageTemp.name"></v-text-field>
            <v-text-field
              label="Author"
              disabled
              filled
              :placeholder="$store.getters['authors/getAuthorNameById'](packageTemp.authorId)"
            ></v-text-field>
            <v-textarea label="Description" v-model="packageTemp.description" rows="3"></v-textarea>
            <v-combobox
              v-model="packageTemp.tags"
              :items="existingTags"
              :search-input.sync="tagSearch"
              hide-selected
              hint=""
              label="Tags"
              multiple
              persistent-hint
              append-icon=""
            >
              <template v-slot:no-data>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title>
                      No results matching "<strong>{{ tagSearch }}</strong
                      >". Press <kbd>enter</kbd> to create a new one
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </template>
              <template v-slot:selection="{ attrs, item, select, selected }">
                <v-chip
                  v-bind="attrs"
                  :input-value="selected"
                  close
                  @click="select"
                  @click:close="removeTag(item)"
                >
                  {{ item }}
                </v-chip>
              </template>
            </v-combobox>
            <v-text-field v-model="packageTemp.website" label="Website URL"></v-text-field>
            <v-text-field
              v-model="imageInput"
              :append-outer-icon="imageInput && 'mdi-plus-thick'"
              clear-icon="mdi-close"
              clearable
              label="Add an image URL"
              hint="The first image will be used as the thumbnail in the browse listing"
              @click:append-outer="addImage"
              @click:clear="clearImageInput"
            ></v-text-field>
            <!-- <v-row class="" justify="start"> -->
            <draggable v-model="packageTemp.images" class="row ml-0 mb-8">
              <div v-for="(image, index) in packageTemp.images" :key="image" class="mr-4 img-draggable">
                <v-icon @click="removeImage(index)">mdi-close</v-icon>
                <div class="img-wrapper">
                  <img :src="image" alt="" />
                </div>
              </div>
            </draggable>
            <!-- </v-row> -->
          </v-card-text>
        </v-card>

        <br /><br />

        <v-card elevation="4" outlined>
          <v-card-title class="vo-card-title-light">Configuration</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-text-field label="Source" disabled filled :placeholder="displaySource"></v-text-field>
            <div class="subtitle-1">Releases available</div>
            <v-radio-group v-model="packageTemp.sourceData.releaseSetting" mandatory>
              <v-radio
                v-for="setting in releaseSettings"
                :key="setting.value"
                :label="setting.label"
                :value="setting.value"
              ></v-radio>
            </v-radio-group>
            <v-autocomplete
              v-model="packageTemp.dependencyIds"
              chips
              deletable-chips
              multiple
              label="Package Dependencies"
              :search-input.sync="dependencySearch"
              :items="packages"
            ></v-autocomplete>
          </v-card-text>
        </v-card>

        <br /><br />

        <v-card elevation="4" outlined>
          <v-card-title class="vo-card-title-light">Accessibility</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div class="subtitle-1">Visibility</div>
            <div class="caption warning--text">
              Please note the following side effects of changing package visibility:
              <br />
              PUBLIC -> PRIVATE: access will be removed from any enterprise or individual; private
              subscriptions will be required to grant access
              <br />
              PRIVATE -> PUBLIC: any enterprise or individual will have access; subscriber data will be
              deleted
            </div>
            <v-radio-group v-model="packageTemp.visibility" mandatory>
              <v-radio
                v-for="setting in visibilitySettings"
                :key="setting.value"
                :label="setting.label"
                :value="setting.value"
              ></v-radio>
            </v-radio-group>
            <v-data-table
              v-if="packageTemp.visibility === PackageVisibility.Private"
              fixed-header
              :headers="headersSubscribers"
              :items="subscribers"
              :items-per-page="10"
              sort-by="name"
            >
              <template v-slot:top>
                <v-toolbar flat>
                  <v-toolbar-title> Subscribers ({{ subscribers && subscribers.length }}) </v-toolbar-title>
                </v-toolbar>
              </template>
              <template v-slot:[`item.actions`]="{ item }">
                <td class="d-flex align-center justify-center">
                  <ActionIconConfirm
                    icon="mdi-delete"
                    acceptColor="error"
                    :acceptAction="() => removeSubscriber(item.enterpriseId)"
                  />
                </td>
              </template>
            </v-data-table>
            <div class="subtitle-1">Status</div>
            <div class="caption warning--text">
              INACTIVE packages will not be accessible, regardless of visibility
              <br />
              ACTIVE packages' accessibility will be controlled by visibility
            </div>
            <v-switch
              v-model="packageTemp.status"
              :label="displayStatus"
              :true-value="PackageStatus.Active"
              :false-value="PackageStatus.Inactive"
              class="mb-4"
            ></v-switch>
          </v-card-text>
        </v-card>

        <br /><br />

        <v-btn class="mr-4" @click="() => $router.push('/admin')">Cancel</v-btn>
        <v-btn @click="save" color="primary">Save</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import _ from "lodash";
import draggable from "vuedraggable";
import { GithubRepository, Package } from "../../../types/package";
import { PackageStatus, PackageVisibility, PackageReleaseSetting, PackageSource } from "../../../types/enums";
import ActionIconConfirm from "../../components/ActionIconConfirm.vue";

@Component({
  components: { draggable, ActionIconConfirm }
})
export default class PackageEdit extends Vue {
  PackageStatus = PackageStatus;
  PackageSource = PackageSource;
  PackageVisibility = PackageVisibility;

  releaseSettings = [
    { label: "Latest and pre-release only", value: PackageReleaseSetting.LatestAndPrerelease },
    { label: "All", value: PackageReleaseSetting.All }
  ];

  visibilitySettings = Object.entries(PackageVisibility).map(entry => {
    return {
      label: entry[0],
      value: entry[1]
    };
  });

  headersSubscribers = [
    { text: "Name", value: "name" },
    { text: "", value: "actions", sortable: false, align: "center", width: 105 }
  ];

  existingTags = [
    "Dynamo",
    "Revit",
    "Space Planning",
    "Generative Design",
    "AutoCAD",
    "Grasshopper",
    "Drawing Management"
  ];
  tagSearch: string | null = null;
  dependencySearch: string | null = null;
  imageInput = "";

  packageTemp: Package = this.defaultPackageData();

  // COMPUTED PROPERTIES
  get displaySource() {
    const srcData = this.packageTemp.sourceData as GithubRepository;
    const url = `https://github.com/${srcData.full_name}`;
    return (
      Object.keys(PackageSource).find(
        (key: string) => (PackageSource as any)[key] === this.packageTemp.source
      ) +
      "        " +
      url
    );
  }
  get displayStatus() {
    return Object.keys(PackageStatus).find(
      (key: string) => (PackageStatus as any)[key] === this.packageTemp.status
    );
  }
  get packages() {
    return this.$store.state.packages.packages
      .filter((pkg: Package) => pkg.id !== this.packageTemp.id)
      .map((pkg: Package) => {
        return {
          text: `${pkg.name} (${this.$store.getters["authors/getAuthorNameById"](pkg.authorId)})`,
          value: pkg.id
        };
      });
  }

  get subscribers() {
    return this.packageTemp.subscriberIds?.map(enterpriseId => {
      return {
        enterpriseId,
        name: this.$store.getters["enterprises/getEnterpriseNameById"](enterpriseId)
      };
    });
  }

  // METHODS
  defaultPackageData(): Package {
    return {
      id: "",
      name: "",
      description: "",
      tags: [],
      authorId: "",
      images: [],
      website: "",
      status: PackageStatus.Inactive,
      visibility: PackageVisibility.Private,
      source: PackageSource.Github,
      sourceData: {},
      dependencyIds: []
    };
  }

  removeTag(item: string) {
    this.packageTemp.tags = this.packageTemp.tags.filter(tag => tag !== item);
  }

  addImage() {
    this.packageTemp.images.push(this.imageInput);
    this.imageInput = "";
  }

  clearImageInput() {
    this.imageInput = "";
  }

  removeImage(index: number) {
    this.packageTemp.images.splice(index, 1);
  }

  removeSubscriber(subscriberId: string) {
    // TODO: call function to remove the package id refs from the enterprise/subscriber
    if (this.packageTemp.subscriberIds) {
      this.packageTemp.subscriberIds = this.packageTemp.subscriberIds.filter(id => id !== subscriberId);
    }
  }

  async save() {
    try {
      const success = await this.$store.dispatch("packages/updatePackageData", this.packageTemp);
      if (success) this.$router.push("/admin");
    } catch (error) {
      console.log(error);
    }
  }

  // LIFECYCLE HOOKS
  mounted() {
    const packageRef: Package = this.$store.state.packages.packages.find(
      (pkg: Package) => pkg.id === this.$route.params.packageId
    );
    this.packageTemp = _.cloneDeep(packageRef);
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

.img-draggable {
  &:first-child {
    .img-wrapper {
      border: 2px solid black;
    }
  }

  .img-wrapper {
    height: 80px;
    border: 1px solid rgb(192, 192, 192);
    &:not(:last-child) {
      margin-right: 8px;
    }
    img {
      max-width: 100%;
      max-height: 100%;
      display: block;
    }
  }
}
</style>
