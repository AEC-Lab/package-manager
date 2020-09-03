<template>
  <v-app>
    <!-- <v-app-bar app color="primary" dark></v-app-bar> -->
    <div id="router">
      <router-view></router-view>
    </div>
    <Menu id="menu"></Menu>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import Menu from "@/components/Menu.vue";

// import { Component } from "vue-property-decorator";

export default Vue.extend({
  components: {
    Menu
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
    }
  }
});
</script>
<style lang="scss" scoped>
#router {
  margin-left: 55px;
}
#menu {
  position: absolute;
  height: 100%;
}
</style>
