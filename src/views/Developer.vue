<template>
  <v-container class="vo-if-container">
    <ValidateSchema />
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "@vue/composition-api";
import ValidateSchema from "@/components/developer/ValidateSchema.vue";

export default defineComponent({
  components: { ValidateSchema },
  setup() {
    return {};
  }
});
</script>
<style lang="scss" scoped></style>
