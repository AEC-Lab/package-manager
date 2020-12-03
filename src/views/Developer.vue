<template>
  <v-container id="container">
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
<style lang="scss" scoped>
#container {
  background-color: rgb(255, 255, 255);
  height: 100%;
  max-width: 100%;
  padding: 20px;
  position: absolute;
  overflow: auto;

  .is-success {
    color: green;
  }
  .is-failed {
    color: red;
  }
}
</style>
