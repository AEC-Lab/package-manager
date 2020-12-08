import Vue from "vue";
import Vuex, { MutationTree } from "vuex";

import { repos } from "./repos";
import { github } from "./github";
import { auth } from "./auth";

Vue.use(Vuex);

export interface IRootState {
  github: any;
  repos: any;
  auth: any;
  listeners: firebase.Unsubscribe[];
}

const state = (): IRootState => ({ github, repos, auth, listeners: [] });

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
    repos,
    github,
    auth
  }
});
