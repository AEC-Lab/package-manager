import Vue from "vue";
import Vuex, { MutationTree } from "vuex";

import { packages } from "./packages";
import { authors } from "./authors";
import { enterprises } from "./enterprises";
import { users } from "./users";
import { github } from "./github";
import { auth } from "./auth";
import { config } from "./config";
import { snackbar } from "./snackbar";

Vue.use(Vuex);

export interface IRootState {
  packages: any;
  authors: any;
  enterprises: any;
  users: any;
  github: any;
  auth: any;
  config: any;
  snackbar: any;
  listeners: firebase.Unsubscribe[];
}

const state = (): IRootState => ({
  packages,
  authors,
  enterprises,
  users,
  github,
  auth,
  config,
  snackbar,
  listeners: []
});

export const mutations: MutationTree<IRootState> = {
  addListener(state, listener: firebase.Unsubscribe) {
    state.listeners.push(listener);
  },
  unsubscribeAllListeners(state) {
    for (const listener of state.listeners) {
      listener();
    }
    state.listeners = [];
  }
};

export default new Vuex.Store({
  state,
  mutations,
  modules: {
    packages,
    authors,
    enterprises,
    users,
    github,
    auth,
    config,
    snackbar
  }
});
