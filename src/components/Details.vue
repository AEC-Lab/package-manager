<template>
  <v-container id="details-container" v-bind:class="{ closed: isClosed }">
    <v-row>
      <v-icon @click="callClose">mdi-arrow-left</v-icon>
    </v-row>
    <v-row>{{ repo.name }}</v-row>
    <v-row>{{ repo.full_name }}</v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, ComputedRef, PropType } from "@vue/composition-api";
import { Repository } from "../../types/repos";

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
    function callClose() {
      isClosed.value = true;
      setTimeout(() => props.closeDetails(), 500);
    }

    return {
      isClosed,
      callClose
    };
  }
});
</script>

<style lang="scss">
#details-container {
  background-color: rgb(255, 255, 255);
  height: 100%;
  width: 100%;
  padding: 20px;
  position: absolute;
  z-index: 10;
  left: -100%;
  animation: slide-open 0.6s forwards;
  &.closed {
    left: 0;
    animation: slide-closed 0.5s forwards;
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
