import Vue from "vue";
import Vuetify from "vuetify/lib";
import VuetifyConfirm from "vuetify-confirm";

const vuetify = new Vuetify({
  theme: {
    themes: {
      light: {
        primary: "#493e96",
        secondary: "#6c8088"
      },
      dark: {
        primary: "#493e96",
        secondary: "#f4f4f4"
      }
    }
  }
});

Vue.use(Vuetify);

Vue.use(VuetifyConfirm, { vuetify });

export default vuetify;
