<template>
  <!-- <ResetPassword
    :mode="mode"
    :actionCode="actionCode"
    :apiKey="apiKey"
    :lang="lang"
    :continueUrl="continueUrl"
  /> -->
  <ResetPassword
    v-if="mode === 'resetPassword'"
    :mode="mode"
    :actionCode="actionCode"
    :apiKey="apiKey"
    :lang="lang"
    :continueUrl="continueUrl"
  />
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import ResetPassword from "@/components/auth/ResetPassword.vue";

@Component({
  name: "LoginManagement",
  components: { ResetPassword }
})
export default class LoginManagement extends Vue {
  // DATA PROPERTIES
  mode: any = null;
  actionCode: any = null;
  apiKey: any = null;
  lang: any = null;
  continueUrl: any = null;

  // LIFECYCLE HOOKS
  async mounted() {
    // Workflow adapted from: https://firebase.google.com/docs/auth/custom-email-handler

    // Get query parameters from URL
    const { mode, apiKey, lang, continueUrl } = this.$route.query;
    const actionCode = this.$route.query.oobCode;

    // Set params to local state; "mode" determines which UI component is displayed
    this.mode = mode;
    this.actionCode = actionCode;
    this.apiKey = apiKey;
    this.lang = lang;
    this.continueUrl = continueUrl;
  }
}
</script>
