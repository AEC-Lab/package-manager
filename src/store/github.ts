import { Module, GetterTree, MutationTree, ActionTree } from "vuex";
import { IRootState } from ".";
import { GenericObject } from "../../types/github";
import GitHub from "../integrations/github";

export interface IGitHubState {
  repositories: GenericObject[];
}

export const state: IGitHubState = {
  repositories: []
};

export const getters: GetterTree<IGitHubState, IRootState> = {};

export const mutations: MutationTree<IGitHubState> = {
  setRepositories(state, repositories: GenericObject[]) {
    state.repositories = repositories;
  }
};

export const actions: ActionTree<IGitHubState, IRootState> = {
  async getRepositories({ commit }) {
    const repositories = await GitHub.getRepositories();
    commit("setRepositories", repositories);
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
