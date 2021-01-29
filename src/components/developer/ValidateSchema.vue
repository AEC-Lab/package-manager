<template>
  <div>
    <h5 class="text-h5 mb-8">Validate Schema</h5>
    <v-form ref="inputForm">
      <div v-cloak @drop.prevent="addDropFile" @dragover.prevent>
        <v-file-input
          v-model="testFile"
          outlined
          placeholder="Drag and drop a file or click here"
          accept=".package"
          :rules="fileRules"
        />
      </div>
    </v-form>
    <v-row class="d-flex align-center mb-4">
      <v-col>
        <v-btn @click="validateSchema" :loading="validating" :disabled="!isFileValid">Validate</v-btn>
        <span class="text-subtitle-1 ml-4" :class="responseTypeSuccess ? 'is-success' : 'is-failed'">{{
          responseMessage
        }}</span>
      </v-col>
    </v-row>
    <VueJsonPretty :data="responseBody" v-if="responseBody" />
  </div>
</template>

<script lang="ts">
import axios from "axios";
import { defineComponent, ref, computed, Ref, watch } from "@vue/composition-api";
// @ts-ignore
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";

export default defineComponent({
  components: { VueJsonPretty },
  setup(props, context) {
    const $store = context.root.$store;
    const validating: Ref<boolean> = ref(false);
    const testFile: Ref<File | undefined> = ref();
    const inputForm: Ref<HTMLFormElement | null> = ref(null);
    const responseMessage: Ref<string> = ref("");
    const responseTypeSuccess: Ref<boolean> = ref(false);
    const responseBody: Ref<any | null> = ref(null);

    const repositories = computed(() => {
      return $store.state.repositories;
    });

    const fileRules = [
      (file: File) => {
        if (!file) return true;
        return file.name === "manage.package" || "You must upload a '.package' file";
      }
    ];

    function addDropFile(e: DragEvent) {
      testFile.value = e.dataTransfer?.files[0];
    }

    const isFileValid = computed(() => {
      return testFile.value ? inputForm.value?.validate() : false;
    });

    async function validateSchema() {
      validating.value = true;
      try {
        const payload = JSON.parse(await testFile.value!.text());
        const uri = `${process.env.VUE_APP_API}/validate`;
        const response = await axios.post(uri, payload);
        responseMessage.value = response.data;
        responseTypeSuccess.value = true;
      } catch (error) {
        if (error instanceof SyntaxError) {
          responseMessage.value = "Unable to parse JSON data";
        } else if (error.response.status === 500) {
          responseMessage.value = "Server error... please try again later";
        } else if (error.response.status === 400) {
          responseMessage.value = "Invalid schema; see details below";
          responseBody.value = error.response.data;
        } else {
          responseMessage.value = error.response.data;
        }
        responseTypeSuccess.value = false;
      }
      validating.value = false;
    }

    watch(testFile, async newVal => {
      if (newVal && isFileValid) {
        console.log(`Validating ${newVal.name}...`);
      } else {
        responseMessage.value = "";
        responseBody.value = null;
      }
    });

    return {
      validating,
      testFile,
      inputForm,
      repositories,
      isFileValid,
      fileRules,
      addDropFile,
      validateSchema,
      responseMessage,
      responseTypeSuccess,
      responseBody
    };
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
