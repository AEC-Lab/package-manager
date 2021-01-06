<template>
  <v-container id="container">
    <v-row>
      <v-col cols="12">
        <v-text-field label="Name" v-model="authorTemp.name"></v-text-field>
        <v-textarea label="Description" v-model="authorTemp.description" rows="3"></v-textarea>

        <v-text-field label="Sources" disabled filled :placeholder="displaySources"></v-text-field>

        <v-text-field
          v-model="authorTemp.thumbnailUrl"
          clear-icon="mdi-close"
          clearable
          label="Add a profile image URL"
          @click:clear="clearImageInput"
        ></v-text-field>
        <v-row class="" justify="start">
          <div class="img-wrapper">
            <img :src="authorTemp.thumbnailUrl || fallbackImage" alt="" @error="e => imageLoadOnError(e)" />
          </div>
        </v-row>
        <v-btn class="mr-4" @click="() => $router.push('/admin')">Cancel</v-btn>
        <v-btn @click="save" color="primary">Save</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import _ from "lodash";
import { Author } from "../../../types/author";

@Component
export default class AuthorEdit extends Vue {
  fallbackImage =
    "https://media.istockphoto.com/vectors/default-profile-picture-avatar-photo-placeholder-vector-illustration-vector-id1214428300?b=1&k=6&m=1214428300&s=612x612&w=0&h=kMXMpWVL6mkLu0TN-9MJcEUx1oSWgUq8-Ny6Wszv_ms=";

  authorTemp: Author = this.defaultAuthorData();

  // COMPUTED PROPERTIES
  get displaySources(): any {
    const sources: any = {};
    if ("github" in this.authorTemp.sourceConfig) {
      sources["Github"] = this.authorTemp.sourceConfig.github!.name;
    }
    // add other sources as needed
    let formattedSources = "";
    for (const source in sources) {
      formattedSources = formattedSources.concat(`${source} - ${sources[source]}`);
    }
    return formattedSources;
  }

  // METHODS
  defaultAuthorData(): Author {
    return {
      id: "",
      name: "",
      description: "",
      thumbnailUrl: "",
      sourceConfig: {}
    };
  }

  clearImageInput() {
    this.authorTemp.thumbnailUrl = "";
  }

  imageLoadOnError(e: Event) {
    const img = e.target as HTMLImageElement;
    img.src = this.fallbackImage;
  }

  async save() {
    try {
      await this.$store.dispatch("authors/updateAuthorData", this.authorTemp);
      this.$router.push("/admin");
    } catch (error) {
      console.log(error);
    }
  }

  // LIFECYCLE HOOKS
  mounted() {
    const authorRef: Author = this.$store.state.authors.authors.find(
      (author: Author) => author.id === this.$route.params.authorId
    );
    this.authorTemp = _.cloneDeep(authorRef);
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
