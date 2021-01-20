<template>
  <v-container id="details-container" v-bind:class="{ closed: isClosed }">
    <div class="mb-16">
      <v-icon class="back-btn" x-large @click="callClose">mdi-arrow-left</v-icon>
    </div>
    <h1 class="text-h4">{{ pkg.name }}</h1>
    <v-row class="mb-4">
      <v-col>
        <div class="text-body-1">
          {{ pkg.description }}
        </div>
        <br /><br />
        <v-chip v-for="tag in pkg.tags" :key="tag" class="mr-2">{{ tag }}</v-chip>
      </v-col>
      <v-col id="detail-specs">
        <!-- <v-btn class="mb-4">Install</v-btn> -->
        <v-menu bottom offset-y>
          <template v-slot:activator="{ on, attrs }">
            <div class="split-btn mb-4">
              <v-btn
                :loading="isLoading"
                :color="buttonConfig.color"
                class="main-btn"
                @click="e => installActionHandlerWrapper(e, pkg, buttonConfig.handler)"
                >{{ buttonConfig.text }}</v-btn
              >
              <v-btn v-on="on" v-bind="attrs" :color="buttonConfig.color" class="actions-btn">
                <v-icon>mdi-menu-down</v-icon>
              </v-btn>
            </div>
          </template>
          <v-list>
            <v-list-item
              class="release-item"
              v-for="release in releases"
              :key="release.id"
              @click="downloadRelease(release)"
            >
              <v-col cols="2" class="text-body-2">{{ release.tag_name.replace("v", "") }}</v-col>
              <v-col class="text-body-2">{{ release.name }}</v-col>
              <v-col cols="3" class="text-body-2">{{
                new Date(release.published_at).toLocaleDateString()
              }}</v-col>
              <v-col cols="1">
                <v-icon v-if="isReleaseInstalled(release)">mdi-check</v-icon>
              </v-col>
            </v-list-item>
          </v-list>
        </v-menu>
        <div class="d-flex justify-space-between mb-2 subtitle-1">
          <span>Latest Release:</span>
          <span>{{ latestReleaseVersion }}</span>
        </div>
        <div class="d-flex justify-space-between mb-2 subtitle-1">
          <span>Release Date:</span>
          <span>{{ latestReleaseDate }}</span>
        </div>
        <div class="d-flex justify-space-between mb-2 subtitle-1">
          <span>Author:</span>
          <span>{{ author.name }}</span>
        </div>
        <div class="d-flex justify-space-between subtitle-1">
          <span>Website:</span>
          <a :href="pkg.website" target="_blank">{{ pkg.website }}</a>
        </div>
      </v-col>
    </v-row>
    <v-row class="ml-0 mr-0">
      <v-card
        v-for="(image, index) in pkg.images"
        :key="index"
        class="mr-4 mb-4"
        @click="imageIndex = index"
        outlined
      >
        <div class="img-wrapper">
          <img :src="image" alt="" />
        </div>
      </v-card>
    </v-row>

    <CoolLightBox :items="gallery" :index="imageIndex" @close="imageIndex = null"> </CoolLightBox>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from "@vue/composition-api";
// @ts-ignore
import CoolLightBox from "vue-cool-lightbox";
import "vue-cool-lightbox/dist/vue-cool-lightbox.min.css";
import { GenericObject } from "types/github";
import { GithubRepository, Package } from "../../../types/package";
import { PackageConfigLocal } from "../../../types/config";
import { Author } from "../../../types/author";
import { getButtonConfig, installPackage } from "../../utils/install";
import { PackageReleaseSetting, PackageSource } from "../../../types/enums";

type CloseHandler = () => void;

export default defineComponent({
  components: { CoolLightBox },
  props: {
    pkg: {
      type: Object as () => Package,
      required: true
    },
    closeDetails: {
      type: Function as PropType<CloseHandler>,
      required: true
    }
  },
  setup(props, context) {
    const isClosed = ref(false);
    const isLoading = ref(false);

    const gallery = computed(() => {
      return props.pkg.images.map(img => {
        return {
          src: img
        };
      });
    });
    const imageIndex = ref(null);

    const author = computed(() => {
      return context.root.$store.state.authors.authors.find(
        (author: Author) => author.id === props.pkg.authorId
      );
    });
    const releases = computed(() => {
      if (props.pkg.source === PackageSource.Github) {
        const srcData = props.pkg.sourceData as GithubRepository;
        if (srcData.releaseSetting === PackageReleaseSetting.LatestAndPrerelease) {
          return context.root.$store.getters["github/getLatestAndPrereleases"](props.pkg);
        } else if (srcData.releaseSetting === PackageReleaseSetting.All) {
          return context.root.$store.getters["github/getReleasesByPackage"](props.pkg);
        } else {
          return context.root.$store.getters["github/getReleasesByPackage"](props.pkg);
        }
      } else if (props.pkg.source === PackageSource.Azure) return [];
      // TBD
      else if (props.pkg.source === PackageSource.Url) return [];
      // TBD
      else return [];
    });
    const latestRelease = computed(() => context.root.$store.getters["github/getLatestRelease"](props.pkg));
    const latestReleaseVersion = computed(
      () => latestRelease.value && latestRelease.value.tag_name.replace("v", "")
    );
    const latestReleaseDate = computed(
      () => latestRelease.value && new Date(latestRelease.value.published_at).toLocaleDateString()
    );
    const buttonConfig = computed(() => {
      return getButtonConfig(props.pkg);
    });

    function isReleaseInstalled(release: GenericObject): boolean {
      const localPackageConfig: PackageConfigLocal = context.root.$store.state.config.localConfig.packages.find(
        (pkg: PackageConfigLocal) => pkg.packageId === props.pkg.id
      );
      if (!localPackageConfig) return false;
      return release.id === localPackageConfig.releaseId;
    }

    function callClose() {
      isClosed.value = true;
      setTimeout(() => props.closeDetails(), 500);
    }

    async function installActionHandlerWrapper(event: Event, pkg: Package, handler: Function) {
      isLoading.value = true;
      await handler(event, pkg);
      isLoading.value = false;
    }

    async function downloadRelease(release: GenericObject) {
      isLoading.value = true;
      try {
        await installPackage(props.pkg, release);
        context.root.$snackbar.flash({
          content: `Successfully installed ${props.pkg.name} - ${release.tag_name.replace("v", "")}`,
          color: "success"
        });
      } catch (error) {
        context.root.$snackbar.flash({
          content: `${error} - ${props.pkg.name}`,
          color: "error"
        });
      }
      isLoading.value = false;
    }

    return {
      gallery,
      imageIndex,
      isClosed,
      isLoading,
      isReleaseInstalled,
      callClose,
      installActionHandlerWrapper,
      downloadRelease,
      author,
      releases,
      latestRelease,
      latestReleaseVersion,
      latestReleaseDate,
      buttonConfig
    };
  }
});
</script>

<style lang="scss">

</style>
