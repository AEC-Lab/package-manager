<template>
  <v-container id="container">
    <v-row>
      <v-col cols="12">
        <v-text-field label="Name" v-model="name"></v-text-field>
        <v-textarea label="Description" v-model="description" rows="3"></v-textarea>

        <v-text-field label="Sources" disabled filled placeholder="GitHub"></v-text-field>

        <v-text-field
          v-model="image"
          clear-icon="mdi-close"
          clearable
          label="Add an image URL"
          @click:clear="clearImageInput"
        ></v-text-field>
        <v-row class="" justify="start">
          <div class="img-wrapper">
            <img :src="image" alt="" @error="e => imageLoadOnError(e)" />
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

@Component
export default class AuthorEdit extends Vue {
  name = "Voyansi";
  description = "Leading innovator of software and technology serving the AEC industry and beyond";

  image = "https://www.voyansi.com/hubfs/voyansi_grey.png";
  fallbackImage =
    "https://media.istockphoto.com/vectors/default-profile-picture-avatar-photo-placeholder-vector-illustration-vector-id1214428300?b=1&k=6&m=1214428300&s=612x612&w=0&h=kMXMpWVL6mkLu0TN-9MJcEUx1oSWgUq8-Ny6Wszv_ms=";

  // METHODS
  clearImageInput() {
    this.image = "";
  }

  imageLoadOnError(e: Event) {
    const img = e.target as HTMLImageElement;
    img.src = this.fallbackImage;
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
