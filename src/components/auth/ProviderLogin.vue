<template>
  <v-card-text class="mt-10">
    <v-btn
      @click="signInWithGoogle"
      :loading="btnLoadingGoogle"
      class="mb-2"
      large
      color="teal darken-1"
      dark
      width="100%"
    >
      <v-icon left dark color="white">
        mdi-google
      </v-icon>
      <span class="mr-4">
        Sign in with Google
      </span>
    </v-btn>
    <v-btn
      @click="signInWithGithub"
      :loading="btnLoadingGithub"
      large
      color="teal darken-1"
      dark
      width="100%"
    >
      <v-icon left dark color="white">
        mdi-github
      </v-icon>
      <span class="mr-4">
        Sign in with GitHub
      </span>
    </v-btn>
    <div class="vo-link mt-8" @click="toggleMode">
      Sign in with Email and Password
    </div>
  </v-card-text>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";

@Component
export default class ProviderLogin extends Vue {
  // PROPS
  @Prop() readonly toggleMode!: () => void;

  // DATA PROPERTIES
  btnLoadingGoogle = false;
  btnLoadingGithub = false;

  // METHODS
  async signInWithGoogle() {
    this.btnLoadingGoogle = true;
    try {
      await this.$store.dispatch("auth/loginWithGoogle");
    } catch (error) {
      console.log(error);
    }
  }

  async signInWithGithub() {
    this.btnLoadingGithub = true;
    try {
      await this.$store.dispatch("auth/loginWithGithub");
    } catch (error) {
      console.log(error);
    }
  }
}
</script>

<style lang="scss" scoped></style>
