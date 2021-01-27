import Vue from "vue";
import Vuetify from "vuetify/lib";

Vue.use(Vuetify);
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
export default new Vuetify({});
