import { Module, GetterTree, MutationTree, ActionTree } from "vuex";
import { IRootState } from ".";
import { Repository } from "../../types/repos";
import { firestore } from "../integrations/firebase";

export interface IReposState {
  repositories: Repository[];
}

export const state: IReposState = {
  repositories: []
};

export const getters: GetterTree<IReposState, IRootState> = {};

export const mutations: MutationTree<IReposState> = {
  setRepositories(state, payload: Repository[]) {
    state.repositories = payload;
  }
};

export const actions: ActionTree<IReposState, IRootState> = {
  repositoriesListener({ commit }) {
    try {
      const listener = firestore.collection("repositories").onSnapshot(snapshot => {
        const repositories = snapshot.docs.map(doc => doc.data());
        commit("setRepositories", repositories);
      });
      commit("addListener", listener, { root: true });
    } catch (error) {
      // ! integrate with stack driver in cases like these!
      console.error(error);
    }
  }
};

const namespaced = true;

export const repos: Module<IReposState, IRootState> = {
  namespaced,
  state,
  getters,
  mutations,
  actions
};
