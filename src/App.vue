<template>
  <v-app>
    <!-- <v-app-bar app color="primary" dark></v-app-bar> -->
    <v-card :height="height">
      <v-navigation-drawer
        width="200"
        v-model="drawer"
        :mini-variant.sync="mini"
        :expand-on-hover="true"
        :permanent="true"
        dark
      >
        <v-list dense nav class="py-0">
          <v-list-item two-line :class="true && 'px-0'">
            <v-list-item-avatar>
              <v-avatar color="indigo" size="36">G</v-avatar>
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title>Grant</v-list-item-title>
              <v-list-item-subtitle>AEC Lab</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <v-divider></v-divider>

          <v-list-item v-for="item in items" :key="item.title" link>
            <v-list-item-icon>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <template v-slot:append>
          <div v-if="!mini" class="pa-2">
            <v-btn block>Logout</v-btn>
          </div>
        </template>
      </v-navigation-drawer>
    </v-card>
    <!-- <div id="router">
      <router-view></router-view>
    </div> -->
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";

// import { Component } from "vue-property-decorator";
// @Component({
//   components: {}
// })
export default Vue.extend({
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
  float: right;
}
</style>
