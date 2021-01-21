<template>
  <v-row class="vo-control-bar">
    <v-col cols="8">
      <v-toolbar dense floating>
        <v-text-field
          hide-details
          prepend-icon="mdi-magnify"
          single-line
          v-model="tempSearchText"
        ></v-text-field>
        <v-icon @click="clearSearch">
          mdi-close
        </v-icon>
      </v-toolbar>
    </v-col>
    <v-spacer />
    <v-col>
      <v-btn-toggle mandatory v-model="tempDisplayToggle" class="vo-toggle-buttons">
        <v-btn>
          <v-icon>mdi-view-grid</v-icon>
        </v-btn>
        <v-btn>
          <v-icon>mdi-view-list</v-icon>
        </v-btn>
      </v-btn-toggle>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Vue, Component, PropSync } from "vue-property-decorator";

@Component({
  name: "ControlBar"
})
export default class ControlBar extends Vue {
  @PropSync("searchText", { type: String }) tempSearchText!: string;
  @PropSync("displayToggle", { type: Number }) tempDisplayToggle!: number;

  clearSearch() {
    this.tempSearchText = "";
  }
}
</script>

<style lang="scss" scoped></style>
