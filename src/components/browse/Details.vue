<template>
  <v-container id="details-container" v-bind:class="{ closed: isClosed }">
    <div class="mb-16">
      <v-icon class="back-btn" x-large @click="callClose">mdi-arrow-left</v-icon>
    </div>
    <h1 class="text-h4">{{ repo.name }}</h1>
    <v-row class="mb-4">
      <v-col>
        <div class="text-body-1">
          Do consectetur minim Lorem et in laboris duis culpa. Pariatur adipisicing aliquip id dolore aliqua
          exercitation eiusmod reprehenderit minim sunt eiusmod nostrud. Esse occaecat elit non nulla aliqua
          ipsum. Cillum magna fugiat in incididunt anim excepteur dolor duis cupidatat aliqua. Ad aute sunt
          veniam amet id est veniam. Officia qui ipsum exercitation do commodo in laboris veniam veniam non
          commodo tempor laborum irure.
        </div>
      </v-col>
      <v-col id="detail-specs">
        <!-- <v-btn class="mb-4">Install</v-btn> -->
        <v-menu bottom offset-y>
          <template v-slot:activator="{ on, attrs }">
            <div class="split-btn mb-4">
              <v-btn :loading="isLoading" color="light" class="main-btn" @click="() => {}">Install</v-btn>
              <v-btn v-on="on" v-bind="attrs" color="light" class="actions-btn">
                <v-icon>mdi-menu-down</v-icon>
              </v-btn>
            </div>
          </template>
          <v-list>
            <v-list-item
              class="release-item"
              v-for="release in releases"
              :key="release.id"
              @click="download(release)"
            >
              <v-col cols="2" class="text-body-2">{{ release.tag_name.replace("v", "") }}</v-col>
              <v-col class="text-body-2">{{ release.name }}</v-col>
              <v-col cols="3" class="text-body-2">{{
                new Date(release.published_at).toLocaleDateString()
              }}</v-col>
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
          <span>{{ author }}</span>
        </div>
        <div class="d-flex justify-space-between subtitle-1">
          <span>Website:</span>
          <a href="http://www.google.com" target="_blank">http://www.google.com</a>
        </div>
      </v-col>
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
import { Repository } from "../../../types/repos";

type CloseHandler = () => void;

export default defineComponent({
  components: {},
  props: {
    repo: {
      type: Object as () => Repository,
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
      return context.root.$store.state.github.repositories.find((r: GenericObject) => r.id === props.repo.id)
        ?.owner.login;
    });
    const releases = computed(() => context.root.$store.getters["github/getReleasesByRepo"](props.repo.id));
    const latestRelease = computed(() =>
      context.root.$store.getters["github/getLatestRelease"](props.repo.id)
    );
    const latestReleaseVersion = computed(
      () => latestRelease.value && latestRelease.value.tag_name.replace("v", "")
    );
    const latestReleaseDate = computed(
      () => latestRelease.value && new Date(latestRelease.value.published_at).toLocaleDateString()
    );

    function callClose() {
      isClosed.value = true;
      setTimeout(() => props.closeDetails(), 500);
    }

    async function download(release: GenericObject) {
      isLoading.value = true;
      const { assets } = release;
      assets.map(async (asset: GenericObject) => {
        const payload = {
          assetId: asset.id,
          releaseId: release.id,
          assetName: asset.name,
          repository: props.repo
        };
        return await context.root.$store.dispatch("github/getAsset", payload);
      });
      isLoading.value = false;
    }

    return {
      isClosed,
      isLoading,
      callClose,
      download,
      author,
      releases,
      latestRelease,
      latestReleaseVersion,
      latestReleaseDate
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
