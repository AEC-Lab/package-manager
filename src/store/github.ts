import { Module, GetterTree, MutationTree, ActionTree } from "vuex";
import { IRootState } from ".";
import { GenericObject } from "../../types/github";
import GitHub from "../integrations/github";

export interface IGitHubState {
  repositories: GenericObject[];
  releases: GenericObject[];
  installations: GenericObject[];
}

export const state: IGitHubState = {
  repositories: [],
  releases: [],
  installations: []
};

export const getters: GetterTree<IGitHubState, IRootState> = {};

export const mutations: MutationTree<IGitHubState> = {
  setRepositories(state, payload: GenericObject[]) {
    state.repositories.push(...payload);
  },
  setReleases(state, payload: GenericObject[]) {
    state.releases.push(...payload);
  },
  setInstallations(state, payload: GenericObject[]) {
    state.installations = payload;
  }
};

export const actions: ActionTree<IGitHubState, IRootState> = {
  async getInstallations({ commit }) {
    const installations = await GitHub.getInstallations();
    commit("setInstallations", installations);
    return installations;
  },
  async getRepositories({ commit }, installation: GenericObject) {
    const repositories = await GitHub.getRepositories(installation);
    commit("setRepositories", repositories);
    return repositories;
  },
  async getReleases({ commit }, repository: GenericObject) {
    const releases = await GitHub.getReleases(repository);
    commit("setReleases", releases);
    return releases;
  },
  async init({ dispatch, state }) {
    await dispatch("getInstallations");
    const repositories = state.installations.map(
      async installation => await dispatch("getRepositories", installation)
    );
    await Promise.all(repositories);
    const releases = state.repositories.map(async repository => await dispatch("getReleases", repository));
    await Promise.all(releases);
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
