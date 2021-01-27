<template>
  <v-container class="vo-container">
    <v-expansion-panels id="container">
      <v-expansion-panel>
        <v-expansion-panel-header>
          <span class="title font-weight-bold">Personal information</span>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-text-field label="Name" placeholder="Complete your name" outlined v-model="name"></v-text-field>
          <p>Your name may appear around Package Manager when you install a package</p>
          <br />

          <v-text-field label="Email" placeholder="Set your Email" outlined v-model="email"></v-text-field>
          <v-text-field
            label="Password"
            placeholder="Set your password"
            type="password"
            outlined
            v-model="pass"
          ></v-text-field>
          <br />
          <v-text-field
            label="Company"
            placeholder="Complete your name"
            outlined
            v-model="company"
          ></v-text-field>
          <v-text-field label="URL" placeholder="Complete your name" outlined v-model="url"></v-text-field>
          <v-text-field
            label="Location"
            placeholder="Complete your name"
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

@Component
export default class Settings extends Vue {
  name = "Fran";
  email = "franp@voyansi.com";
  pass = "123456";
  company = "Voyansi";
  url = "www.voyansi.com";
  location = "US";
}
</script>
<style lang="scss">
#container {
  background-color: rgb(224, 224, 224);
  width: 50%;
}
</style>
