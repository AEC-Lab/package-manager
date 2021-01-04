<template>
  <v-container id="container">
    <v-expansion-panels multiple v-model="panels">
      <v-expansion-panel>
        <v-expansion-panel-header>
          <span class="title font-weight-bold">Packages</span>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-data-table
            fixed-header
            height="10%"
            :headers="headersPackages"
            :items="packages"
            :items-per-page="10"
          >
            <template v-slot:item="{ item }">
              <tr>
                <td>{{ item.name }}</td>
                <td>{{ item.author }}</td>
                <td>{{ item.source }}</td>
                <td>{{ item.status }}</td>
                <td>
                  <v-icon
                    @click="
                      () => {
                        $router.push('/packages/12345/edit');
                      }
                    "
                    >mdi-pencil</v-icon
                  >
                </td>
              </tr>
            </template>
          </v-data-table>
          <v-btn
            outlined
            @click="
              () => {
                $router.push('/packages/create');
              }
            "
          >
            <v-icon left>mdi-plus-thick</v-icon>
            Create Package
          </v-btn>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          <span class="title font-weight-bold">Users</span>
        </v-expansion-panel-header>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          <span class="title font-weight-bold">Authors</span>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-data-table
            fixed-header
            height="10%"
            :headers="headersAuthors"
            :items="authors"
            :items-per-page="10"
          >
            <template v-slot:item="{ item }">
              <tr>
                <td>{{ item.name }}</td>
                <td>
                  <v-chip-group>
                    <v-chip v-for="source in item.sources" :key="source">{{ source }}</v-chip>
                  </v-chip-group>
                </td>
                <td>{{ item.packageCount }}</td>
                <td>
                  <v-icon
                    @click="
                      () => {
                        $router.push('/authors/abcd1234/edit');
                      }
                    "
                    >mdi-pencil</v-icon
                  >
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          <span class="title font-weight-bold">Enterprises</span>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-data-table
            fixed-header
            height="10%"
            :headers="headersEnterprises"
            :items="enterprises"
            :items-per-page="10"
          >
            <template v-slot:item="{ item }">
              <tr>
                <td>{{ item.name }}</td>
                <td>{{ item.memberCount }}</td>
                <td>{{ item.packageCount }}</td>
                <td>
                  <v-icon @click="() => {}">mdi-pencil</v-icon>
                </td>
              </tr>
            </template>
          </v-data-table>
          <v-btn outlined @click="() => {}">
            <v-icon left>mdi-plus-thick</v-icon>
            Create Enterprise
          </v-btn>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Admin extends Vue {
  // DATA PROPERTIES
  panels = [0];

  headersPackages = [
    { text: "Name", value: "name" },
    { text: "Author", value: "author" },
    { text: "Source", value: "source" },
    { text: "Status", value: "status" },
    { text: "", value: "edit" }
  ];

  headersAuthors = [
    { text: "Name", value: "name" },
    { text: "Sources", value: "sources" },
    { text: "Packages", value: "packageCount" },
    { text: "", value: "edit" }
  ];

  headersEnterprises = [
    { text: "Name", value: "name" },
    { text: "Members", value: "memberCount" },
    { text: "Packages", value: "packageCount" },
    { text: "", value: "edit" }
  ];

  packages = [
    { name: "pkg-name-one", id: 1, author: "Voyansi", source: "GitHub", status: "Active" },
    { name: "pkg-name-two", id: 2, author: "Voyansi", source: "GitHub", status: "Inactive" },
    { name: "pkg-name-three", id: 3, author: "Mark Pothier", source: "GitHub", status: "Inactive" },
    { name: "pkg-name-four", id: 4, author: "Mark Pothier", source: "URL", status: "Active" }
  ];

  authors = [
    { name: "Voyansi", id: 1, sources: ["GitHub"], packageCount: 14 },
    { name: "John Smith (me)", id: 2, sources: ["GitHub", "URL"], packageCount: 3 }
  ];

  enterprises = [
    { name: "Salesforce", id: 1, memberCount: 257, packageCount: 6 },
    { name: "Voyansi", id: 2, memberCount: 144, packageCount: 11 },
    { name: "Google", id: 3, memberCount: 1182, packageCount: 23 },
    { name: "Amazon", id: 4, memberCount: 430, packageCount: 8 }
  ];
}
</script>

<style lang="scss" scoped>
#container {
  background-color: rgb(255, 255, 255);
  height: 100%;
  max-width: 100%;
  padding: 20px;
  position: absolute;
  overflow: auto;
}
</style>
