require("dotenv").config();

import Vue from "vue";
import VueCompositionAPI from "@vue/composition-api";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import snackbarPlugin from "./plugins/snackbar";

Vue.use(VueCompositionAPI);
Vue.use(snackbarPlugin, { store });

Vue.config.productionTip = false;

export default new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");
