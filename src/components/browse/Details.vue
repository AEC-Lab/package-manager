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
          <a href="http://www.google.com" target="_blank">http://www.google.com</a>
        </div>
      </v-col>
    </v-row>
    <v-row class="" justify="start">
      <div v-for="image in pkg.images" :key="image" class="mr-4">
        <div class="img-wrapper">
          <img :src="image" alt="" />
        </div>
      </div>
    </v-row>
    <!-- <v-carousel>
      <v-carousel-item :key="i" v-for="i in 5">
        <v-layout row>
          <v-flex xs4 :key="j" v-for="j in 3">
            <img :src="'https://placehold.it/150x150/?text=' + i + '-' + j" alt="" />
          </v-flex>
        </v-layout>
      </v-carousel-item>
    </v-carousel> -->
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from "@vue/composition-api";
import { GenericObject } from "types/github";
import { GithubRepository, Package } from "../../../types/package";
import { PackageConfigLocal } from "../../../types/config";
import { Author } from "../../../types/author";
import { getButtonConfig, installPackage } from "../../utils/install";
import { PackageReleaseSetting, PackageSource } from "../../../types/enums";

type CloseHandler = () => void;

export default defineComponent({
  components: {},
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
          color: "danger"
        });
      }
      isLoading.value = false;
    }

    return {
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
#details-container {
  background-color: rgb(255, 255, 255);
  height: 100%;
  width: 100%;
  max-width: 100%;
  padding: 20px;
  position: absolute;
  z-index: 10;
  left: -100%;
  overflow: auto;
  animation: slide-open 0.6s forwards;
  &.closed {
    left: 0;
    animation: slide-closed 0.5s forwards;
  }

  .back-btn {
    color: rgb(192, 192, 192);
    &:hover {
      color: black;
    }
  }

  #detail-specs {
    display: flex;
    flex-direction: column;
  }

  .main-btn {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    // padding-right: 2px !important;
    flex: 1;
  }
  .actions-btn {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    padding: 0 !important;
    min-width: 35px !important;
    margin-left: -3.5px;
  }
  .split-btn {
    display: inline-block;
    display: flex;
  }
}
.release-item {
  padding: 0;
  cursor: pointer;
  &:hover {
    background-color: rgb(222, 222, 222);
  }
  &:not(:last-child) {
    border-bottom: 1px solid rgb(192, 192, 192);
  }
}

img {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.img-wrapper {
  height: 120px;
  &:not(:last-child) {
    margin-right: 8px;
  }
}

@keyframes slide-open {
  100% {
    left: 0;
  }
}

@keyframes slide-closed {
  100% {
    left: -100%;
  }
}
</style>
