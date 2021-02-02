import Vue from "vue";
import Vuetify from "vuetify/lib";
import VuetifyConfirm from "vuetify-confirm";
import colors from "../styles/variables/colors.scss";

const vuetify = new Vuetify({
  theme: {
    themes: {
      light: {
        primary: colors["voyansi-primary-1"],
        secondary: colors["voyansi-primary-2"],
        accent: colors["voyansi-secondary-4"],
        info: colors["voyansi-secondary-1"]
      },
      dark: {
        primary: colors["voyansi-primary-1"],
        secondary: colors["voyansi-support-3"],
        accent: colors["voyansi-secondary-4"],
        info: colors["voyansi-secondary-1"]
      }
    }
  }
});

Vue.use(Vuetify);

Vue.use(VuetifyConfirm, { vuetify });

export default vuetify;
