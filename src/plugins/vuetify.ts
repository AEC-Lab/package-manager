import Vue from "vue";
import Vuetify from "vuetify/lib";
import VuetifyConfirm from "vuetify-confirm";

const vuetify = new Vuetify({});

Vue.use(Vuetify);
Vue.use(VuetifyConfirm, { vuetify });

export default vuetify;
