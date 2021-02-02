<template>
  <v-app>
    <v-system-bar window app class="vo-titlebar" color="primary">
      <v-img class="mr-4" src="@/assets/v-icon-white.png" max-height="30" max-width="30"> </v-img>
      <span class="vo-titlebar-title">Package Manager</span>
      <v-spacer></v-spacer>
      <v-icon @click="minimize" class="vo-titlebar-btn">mdi-minus</v-icon>
      <v-icon small @click="maximize" class="vo-titlebar-btn">mdi-checkbox-blank-outline</v-icon>
      <v-icon @click="close" class="vo-titlebar-btn">mdi-close</v-icon>
    </v-system-bar>
    <!-- <v-app-bar app color="primary" dark></v-app-bar> -->
    <v-main id="router" v-bind:class="{ 'nav-padding': user }">
      <router-view></router-view>
    </v-main>
    <Menu v-if="user" id="menu"></Menu>
    <Snackbar />
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import Menu from "@/components/Menu.vue";
import Snackbar from "@/components/Snackbar.vue";
import { ipcRenderer } from "electron";

// import { Component } from "vue-property-decorator";

export default Vue.extend({
  components: {
    Menu,
    Snackbar
  },
  name: "App",
  data: () => ({
    drawer: true,
    mini: true,
    items: [
      { title: "Browse", icon: "mdi-archive" },
      { title: "Settings", icon: "mdi-cog" },
      { title: "Admin", icon: "mdi-shield" }
    ]
  }),
  computed: {
    height() {
      return window.innerHeight;
    },
    user() {
      return this.$store.state.auth.user;
    }
  },
  methods: {
    close() {
      ipcRenderer.send("close");
    },
    minimize() {
      ipcRenderer.send("minimize");
    },
    maximize() {
      ipcRenderer.send("maximize");
    }
  }
});
</script>
<style lang="scss" scoped>
// #router {
//   margin-left: 55px;
// }
.nav-padding {
  margin-left: 56px;
}
#menu {
  position: absolute;
  top: 32px !important;
  bottom: 0 !important;
  height: unset !important;
  z-index: 100;
}
</style>
<style lang="scss">
.v-dialog > .v-card > .v-card__text {
  white-space: pre-wrap;
}
</style>
