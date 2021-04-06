<template>
  <v-data-table fixed-header height="10%" :headers="headersAuthors" :items="authors" :items-per-page="10">
    <template v-slot:item="{ item }">
      <tr>
        <td>{{ item.name }}</td>
        <td>
          <v-chip-group>
            <v-chip v-for="source in authorSources(item)" :key="source">{{ source }}</v-chip>
          </v-chip-group>
        </td>
        <td>{{ authorPackageCount(item) }}</td>
        <td class="data-table-cell-icon">
          <v-btn
            icon
            @click="
              () => {
                $router.push(`/authors/${item.id}/edit`);
              }
            "
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </td>
      </tr>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Author } from "../../../types/author";
import { Package } from "../../../types/package";

@Component
export default class AdminAuthorsTable extends Vue {
  // DATA PROPERTIES
  headersAuthors = [
    { text: "Name", value: "name" },
    { text: "Sources", value: "sources" },
    { text: "Packages", value: "packageCount" },
    { text: "", value: "edit" }
  ];

  // COMPUTED PROPERTIES
  get authors(): Author[] {
    return this.$store.state.authors.authors.filter((author: Author) => {
      const authorAdmins = this.$store.getters["authors/getAuthorAdmins"](author.id);
      return authorAdmins.includes(this.$store.state.auth.user.githubId);
    });
  }

  // METHODS
  authorSources(author: Author) {
    const sources: string[] = [];
    if (author.sourceConfig.github) {
      sources.push(
        "Github"
        // Object.keys(PackageSource).find((key: string) => (PackageSource as any)[key] === PackageSource.Github)
      );
    }
    return sources;
  }

  authorPackageCount(author: Author) {
    return this.$store.state.packages.packages.filter((pkg: Package) => pkg.authorId === author.id).length;
  }

  // LIFECYCLE METHODS
}
</script>
