<template>
  <v-card>
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
            <v-list-item-title>Grant Foster</v-list-item-title>
            <v-list-item-subtitle>AEC Lab</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item
          @click="route(item.title)"
          v-for="item in items"
          :key="item.title"
          link
        >
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
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "Menu",
  data: () => ({
    drawer: true,
    mini: true,
    items: [
      { title: "Browse", icon: "mdi-archive" },
      { title: "Settings", icon: "mdi-cog" },
      { title: "Admin", icon: "mdi-shield" }
    ]
  }),
  methods: {
    route(name: string) {
      this.$router.push(name);
    }
  }
});
</script>
<style lang="scss" scoped></style>
