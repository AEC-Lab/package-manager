<template>
  <v-stepper class="process-request-form" v-model="step" vertical>
    <v-stepper-step :complete="step > 1" step="1">
      Paste request code
    </v-stepper-step>
    <v-stepper-content step="1">
      <v-card flat class="mb-4">
        <v-card-text class="pb-0 pt-4">
          <v-text-field
            class="mt-4 mb-4"
            v-model="requestCode"
            label="Request Code"
            hint="Paste in the request code given to you by the requesting subscriber or enterprise"
          ></v-text-field>
        </v-card-text>
      </v-card>
      <v-btn text @click="closeAndClear">
        Cancel
      </v-btn>
      <v-btn color="primary" @click="() => verifyRequestCode(requestCode)" :loading="isWaiting">
        Continue
      </v-btn>
    </v-stepper-content>

    <v-stepper-step :complete="step > 2" step="2">
      Select Packages to grant subscription
    </v-stepper-step>
    <v-stepper-content step="2">
      <v-card flat>
        <v-card-text class="pb-0 pt-4">
          <v-row class="mx-0">
            <div class="subtitle-1">Enterprise requester:</div>
          </v-row>
        </v-card-text>
        <v-card-title>{{ enterpriseName }}</v-card-title>
        <v-card-text>
          <v-autocomplete
            v-model="requestCodeSelectedPackageIds"
            label="Select packages"
            multiple
            chips
            deletable-chips
            clearable
            :items="packages"
            :item-text="
              item => `${item.name} (${$store.getters['authors/getAuthorNameById'](item.authorId)})`
            "
            item-value="id"
            class="mt-4"
          />
        </v-card-text>
      </v-card>
      <v-btn text @click="closeAndClear">
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        @click="() => processSubscriptions(requestCode, requestCodeSelectedPackageIds)"
        :loading="isWaiting"
      >
        Continue
      </v-btn>
    </v-stepper-content>

    <v-stepper-step :complete="step > 3" step="3">
      Finished
    </v-stepper-step>
    <v-stepper-content step="3">
      <v-btn color="primary" @click="closeAndClear">
        Close
      </v-btn>
    </v-stepper-content>
  </v-stepper>
</template>

<script lang="ts">
import Vue from "vue";
import { fireFunc } from "../../integrations/firebase";

export default Vue.extend({
  props: {
    closeDialog: Function,
    packages: Array
  },
  data() {
    return {
      step: 1,
      requestCode: "",
      requestCodeSelectedPackageIds: [],
      enterpriseName: "",
      isWaiting: false
    };
  },
  methods: {
    closeAndClear() {
      this.step = 1;
      this.requestCode = "";
      this.requestCodeSelectedPackageIds = [];
      this.closeDialog();
    },
    async verifyRequestCode(requestCode: string) {
      try {
        this.isWaiting = true;
        const enterpriseName = await (
          await fireFunc.httpsCallable("getEnterpriseNameByRequestCode")({ requestCode })
        ).data;
        this.enterpriseName = enterpriseName;
        this.step += 1;
        this.isWaiting = false;
      } catch (error) {
        this.isWaiting = false;
        this.$snackbar.flash({ content: `Unable to verify request code: ${error}`, color: "error" });
        console.log(error);
      }
    },
    async processSubscriptions(requestCode: string, packageIds: string[]) {
      try {
        this.isWaiting = true;
        await await fireFunc.httpsCallable("processSubscriptions")({ requestCode, packageIds });
        this.step += 1;
        this.isWaiting = false;
      } catch (error) {
        this.isWaiting = false;
        this.$snackbar.flash({ content: `Unable to process subscriptions: ${error}`, color: "error" });
        console.log(error);
      }
    }
  }
});
</script>

<style lang="scss">
.process-request-form.v-stepper {
  box-shadow: none;
}
</style>
