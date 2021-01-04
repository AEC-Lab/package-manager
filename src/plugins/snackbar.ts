import Vue, { PluginObject, VueConstructor } from "vue";
import { Store } from "vuex";
import { IRootState } from "@/store";

interface Flash {
  ({ content, color, timeout }: { content: string; color?: string; timeout?: number }): void;
}

declare type SnackbarPlugin = {
  flash: Flash;
};

declare module "vue/types/vue" {
  interface Vue {
    $snackbar: SnackbarPlugin;
  }
}

const snackbarPlugin: PluginObject<any> = {
  install: (Vue: VueConstructor, { store }: { store: Store<IRootState> }) => {
    if (!store) {
      throw new Error("Please provide vuex store.");
    }
    Vue.prototype.$snackbar = {
      flash: function({ content = "", color = "info", timeout = 5000 }) {
        store.commit("snackbar/flash", { content, color, timeout }, { root: true });
      }
    };
  }
};
export default snackbarPlugin;
