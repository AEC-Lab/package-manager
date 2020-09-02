import Vue from "vue";
import Vuex, { ActionTree, MutationTree } from "vuex";

import { firestore } from "../integrations/firebase";

Vue.use(Vuex);

type IState = {
  repositories: Repository[];
};

interface Repository {
  full_name: string;
  id: number;
  name: string;
  node_id: string;
  private: boolean;
  users: string[];
}

const state = (): IState => ({
  repositories: []
});

const mutations: MutationTree<IState> = {
  setRepositories(state, payload: Repository[]) {
    state.repositories = payload;
  }
};

const actions: ActionTree<IState, IState> = {
  async repositoriesListener({ commit }) {
    try {
      firestore.collection("repositories").onSnapshot(snapshot => {
        const repositories = snapshot.docs.map(doc => doc.data());
        commit("setRepositories", repositories);
      });
    } catch (error) {
      // ! integrate with stack driver in cases like these!
      console.error(error);
    }
  }
};

export default new Vuex.Store({
  state,
  mutations,
  actions,
  modules: {}
});
