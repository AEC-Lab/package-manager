<template>
  <v-container class="vo-container">
    <v-expansion-panels id="container">
      <v-expansion-panel>
        <v-expansion-panel-header>
          <span class="voyansi-font-title">Personal information</span>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-text-field label="Name" placeholder="Complete your name" outlined v-model="name"></v-text-field>
          <p>Your name may appear around Ship when you install a package</p>
          <br />
          <v-text-field
            label="Company"
            placeholder="Complete your name"
            outlined
            v-model="company"
          ></v-text-field>
          <v-text-field label="URL" placeholder="Complete the URL" outlined v-model="url"></v-text-field>

          <v-text-field
            label="Location"
            placeholder="Complete your Location"
            outlined
            v-model="location"
          ></v-text-field>

          <v-btn class="float-right" color="primary">
            Update profile
          </v-btn>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { User } from "types/auth";
import { fireAuth } from "../integrations/firebase";

@Component
export default class Settings extends Vue {
  name = this.user.name;
  company = "Voyansi";
  url = "www.voyansi.com";
  location = "US";

  // COMPUTED PROPERTIES
  get user(): User {
    return this.$store.state.auth.user;
  }
}
</script>
<style lang="scss" scoped>
#container {
  background-color: rgb(224, 224, 224);
  width: 60%;
}
</style>
