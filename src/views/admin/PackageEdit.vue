<template>
  <v-container id="container">
    <v-row>
      <v-col cols="12">
        <v-text-field label="Name" v-model="packageTemp.name"></v-text-field>
        <v-textarea label="Description" v-model="packageTemp.description" rows="3"></v-textarea>
        <v-text-field
          label="Author"
          disabled
          filled
          :placeholder="$store.getters['authors/getAuthorNameById'](packageTemp.authorId)"
        ></v-text-field>
        <v-text-field label="Source" disabled filled :placeholder="displaySource"></v-text-field>
        <div class="caption">Releases available</div>
        <v-radio-group v-model="packageTemp.sourceData.releaseSetting" mandatory>
          <v-radio
            v-for="setting in releaseSettings"
            :key="setting.value"
            :label="setting.label"
            :value="setting.value"
          ></v-radio>
        </v-radio-group>
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
        <draggable v-model="packageTemp.images" class="row ml-0">
          <div v-for="(image, index) in packageTemp.images" :key="image" class="mr-4 img-draggable">
            <v-icon @click="removeImage(index)">mdi-close</v-icon>
            <div class="img-wrapper">
              <img :src="image" alt="" />
            </div>
          </div>
        </draggable>
        <!-- </v-row> -->
        <v-switch
          v-model="packageTemp.status"
          :label="displayStatus"
          :true-value="PackageStatus.Active"
          :false-value="PackageStatus.Inactive"
        ></v-switch>
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

@Component({
  components: { draggable }
})
export default class PackageEdit extends Vue {
  PackageStatus = PackageStatus;
  PackageSource = PackageSource;

  releaseSettings = [
    { label: "Latest and pre-release only", value: PackageReleaseSetting.LatestAndPrerelease },
    { label: "All", value: PackageReleaseSetting.All }
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
      sourceData: {}
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
