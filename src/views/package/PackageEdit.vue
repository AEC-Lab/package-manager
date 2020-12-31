<template>
  <v-container id="container">
    <v-row>
      <v-col cols="12">
        <v-text-field label="Name" v-model="name"></v-text-field>
        <v-textarea label="Description" v-model="description" rows="3"></v-textarea>
        <v-text-field label="Author" disabled filled placeholder="Voyansi"></v-text-field>
        <v-text-field label="Source" disabled filled placeholder="GitHub"></v-text-field>
        <div class="caption">Releases available</div>
        <v-radio-group v-model="releaseSetting" mandatory>
          <v-radio v-for="setting in releaseSettings" :key="setting.value" :label="setting.label"></v-radio>
        </v-radio-group>
        <v-combobox
          v-model="tags"
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
        <v-text-field
          v-model="imageInput"
          :append-outer-icon="imageInput && 'mdi-plus-thick'"
          clear-icon="mdi-close"
          clearable
          label="Add an image URL"
          @click:append-outer="addImage"
          @click:clear="clearImageInput"
        ></v-text-field>
        <v-row class="" justify="start">
          <div v-for="(image, index) in images" :key="image" class="mr-4">
            <v-icon @click="removeImage(index)">mdi-close</v-icon>
            <div class="img-wrapper">
              <img :src="image" alt="" />
            </div>
          </div>
        </v-row>
        <v-switch v-model="active" label="Active"></v-switch>
        <v-btn class="mr-4" @click="() => $router.push('/admin')">Cancel</v-btn>
        <v-btn @click="save" color="primary">Save</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class PackageEdit extends Vue {
  name = "package-name-one";
  description = "";

  releaseSetting = "";
  releaseSettings = [
    { label: "Latest and pre-release only", value: "LATEST_AND_PRERELEASE" },
    { label: "All", value: "ALL" }
  ];

  tags = ["Dynamo", "Revit", "Space Planning", "Generative Design"];
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

  active = true;

  imageInput = "";
  images: string[] = [
    "https://base.imgix.net/files/base/ebm/industryweek/image/2019/04/industryweek_34767_gen_design_czgur.png?auto=format&fit=max&w=1200"
  ];

  // METHODS
  removeTag(item: string) {
    this.tags = this.tags.filter(tag => tag !== item);
  }

  addImage() {
    this.images.push(this.imageInput);
    this.imageInput = "";
  }

  clearImageInput() {
    this.imageInput = "";
  }

  removeImage(index: number) {
    this.images.splice(index, 1);
    // this.images = this.images.filter(image => image !== url);
  }

  save() {
    // TODO: update data in Firestore...
    this.$router.push("/admin");
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
