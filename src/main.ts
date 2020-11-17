require("dotenv").config();

import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import { fireAuth } from "./integrations/firebase";

import VueCompositionAPI from "@vue/composition-api";
Vue.use(VueCompositionAPI);

Vue.config.productionTip = false;

fireAuth.onAuthStateChanged(user => {
  console.log("auth state changed");
  store.dispatch("auth/onAuthStateChangedAction", user);
});

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");
