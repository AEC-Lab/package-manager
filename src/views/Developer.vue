<template>
  <v-container id="container">
    <ValidateSchema />
    <v-btn @click="showSnackbar">Show snackbar</v-btn>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "@vue/composition-api";
import ValidateSchema from "@/components/developer/ValidateSchema.vue";

export default defineComponent({
  components: { ValidateSchema },
  setup(props, context) {
    function showSnackbar() {
      // context.root.$sn
      // context.root.
      context.root.$snackbar.flash({ content: "Great success!" });
      // context.root.$snackbar.flash({ content: "Not success!", color: "error", timeout: 2000 });
    }
    return { showSnackbar };
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
