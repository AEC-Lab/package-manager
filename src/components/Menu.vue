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
            <v-avatar color="indigo" size="36">
              <img v-if="userDisplay.photoURL" :src="userDisplay.photoURL" :alt="userDisplay.initials" />
              <span v-else>{{ userDisplay.initials }}</span>
            </v-avatar>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title>{{ userDisplay.title }}</v-list-item-title>
            <v-list-item-subtitle>AEC Lab</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-divider></v-divider>
        <router-link
          :to="{ name: item.title }"
          v-for="item in items"
          :key="item.title"
          tag="div"
          class="mb-1"
        >
          <v-list-item link>
            <v-list-item-icon>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </router-link>
      </v-list>
      <template v-slot:append>
        <div v-if="!mini" class="pa-2">
          <v-btn block @click="logout">Logout</v-btn>
        </div>
      </template>
    </v-navigation-drawer>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { User } from "types/auth";
import { fireAuth } from "../integrations/firebase";

@Component({ name: "Menu" })
export default class Register extends Vue {
  // DATA PROPERTIES
  drawer = true;
  mini = true;
  items = [
    { title: "Browse", icon: "mdi-archive" },
    //{ title: "Settings", icon: "mdi-cog" },
    { title: "Admin", icon: "mdi-shield" },
    { title: "Developer", icon: "mdi-lead-pencil" }
  ];

  // COMPUTED PROPERTIES
  get user(): User {
    return this.$store.state.auth.user;
  }
  get authUser() {
    return fireAuth.currentUser;
  }
  get userDisplay() {
    if (this.user === null || this.authUser === null) return null;
    return {
      title: this.user.name || this.user.email,
      photoURL: this.authUser.photoURL || null,
      initials: this.parseInitials(this.user.name) || this.authUser.email?.toUpperCase()[0] || "?"
    };
  }

  // METHODS
  route(name: string) {
    this.$router.push({ name });
  }
  async logout() {
    const loggedOut = await this.$store.dispatch("auth/logout");
    if (loggedOut) {
      // const r = this.$router.resolve({
      //   path: this.$route.path
      // });
      // window.location.assign(r.href);
      this.route("Login");
    }
  }
  parseInitials(name: string | null) {
    if (!name) return null;
    return name
      .split(" ")
      .map(x => x[0].toUpperCase())
      .join("")
      .slice(0, 3);
  }
}
</script>
<style lang="scss" scoped></style>
