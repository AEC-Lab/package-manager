<template>
  <v-container id="container">
    <v-row>
      <v-col cols="12">
        <v-text-field label="Name" v-model="name"></v-text-field>
        <v-textarea label="Description" v-model="description" rows="3"></v-textarea>
        <v-select
          label="Author"
          v-model="selectedAuthor"
          :items="authors"
          item-text="name"
          item-value="id"
        ></v-select>
        <v-text-field label="Source URL" v-model="url" hint="Link to package download"> </v-text-field>
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
          hint="The first image will be used as the thumbnail in the browse listing"
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
        <v-btn class="mr-4" @click="() => $router.push('/admin')">Cancel</v-btn>
        <v-btn @click="save" color="primary">Create</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class PackageCreate extends Vue {
  name = "";
  description = "";

  selectedAuthor: any = null;
  authors = [
    { name: "Voyansi", id: "abcd1234" },
    { name: "Mark Pothier", id: "qwerty98765" }
  ];

  url = "";

  tags = [];
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
  images: string[] = [];

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
