import Vue from "vue";

import { Module, GetterTree, MutationTree, ActionTree } from "vuex";
import { IRootState } from ".";
import { GenericObject } from "../../types/github";
import GitHub from "../integrations/github";
import helpers from "../utils/helpers";

export interface IGitHubState {
  repositories: GenericObject[];
  releases: GenericObject;
}

export const state: IGitHubState = {
  repositories: [],
  releases: {}
};

export const getters: GetterTree<IGitHubState, IRootState> = {};

export const mutations: MutationTree<IGitHubState> = {
  setRepositories(state, repositories: GenericObject[]) {
    state.repositories = repositories;
  },
  setReleases(state, payload: GenericObject) {
    Vue.set(state.releases, payload.name, payload.releases);
  }
};

export const actions: ActionTree<IGitHubState, IRootState> = {
  async getRepositories({ commit }) {
    const repositories = await GitHub.getRepositories();
    commit("setRepositories", repositories);
  },
  async getReleases({ commit }, repository) {
    const identity = helpers.ownerId(repository);
    const identityName = helpers.ownerName(repository);
    const releases = await GitHub.getReleases(identityName);
    commit("setReleases", { name: identity, releases });
  },
  async init({ dispatch, state }) {
    await dispatch("getRepositories");
    state.repositories.map(repository => dispatch("getReleases", repository));
  }
};

const namespaced = true;

export const github: Module<IGitHubState, IRootState> = {
  namespaced,
  state,
  getters,
  mutations,
  actions
};
