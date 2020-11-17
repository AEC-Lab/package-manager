import Vue from "vue";
import Vuex from "vuex";

import { repos } from "./repos";
import { auth } from "./auth";

Vue.use(Vuex);

export interface IRootState {} // eslint-disable-line

const state = (): IRootState => ({});

export default new Vuex.Store({
  state,
  modules: {
    repos,
    auth
  }
});
