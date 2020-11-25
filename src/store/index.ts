import Vue from "vue";
import Vuex from "vuex";

import { repos } from "./repos";
import { github } from "./github";
import { auth } from "./auth";

Vue.use(Vuex);

export interface IRootState {
  github: any;
  repos: any;
  auth: any;
}

const state = (): IRootState => ({ github, repos, auth });

export default new Vuex.Store({
  state,
  modules: {
    repos,
    github,
    auth
  }
});
