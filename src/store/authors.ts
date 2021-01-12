import { Module, GetterTree, MutationTree, ActionTree } from "vuex";
import { IRootState } from ".";
import { Author } from "../../types/author";
import { firestore } from "../integrations/firebase";
import Vue from "../main";

export interface IAuthorsState {
  authors: Author[];
  isAuthorListenerSet: boolean;
}

export const state: IAuthorsState = {
  authors: [],
  isAuthorListenerSet: false
};

export const getters: GetterTree<IAuthorsState, IRootState> = {
  // Gets all releases for a given repository
  getAuthorNameById: state => (authorId: string): string => {
    const author = state.authors.find(author => author.id === authorId);
    return author ? author.name : "Unknown";
  }
};

export const mutations: MutationTree<IAuthorsState> = {
  setAuthors(state, payload: Author[]) {
    state.authors = payload;
  },
  setAuthorListener(state, payload) {
    state.isAuthorListenerSet = payload;
  }
};

export const actions: ActionTree<IAuthorsState, IRootState> = {
  authorsListener({ commit }) {
    if (state.isAuthorListenerSet) return;
    try {
      const listener = firestore.collection("authors").onSnapshot(snapshot => {
        const authors = snapshot.docs.map(doc => doc.data()) as Author[];
        commit("setAuthors", authors);
      });
      commit("addListener", listener, { root: true });
      commit("setAuthorListener", true);
    } catch (error) {
      // ! integrate with stack driver in cases like these!
      console.error(error);
    }
  },
  async updateAuthorData(context, payload: Author) {
    try {
      // update editable fields only
      await firestore
        .collection("authors")
        .doc(payload.id)
        .update({
          name: payload.name,
          description: payload.description,
          thumbnailUrl: payload.thumbnailUrl,
          website: payload.website
        });
      Vue.$snackbar.flash({ content: "Author updated", color: "success" });
      return true;
    } catch (error) {
      Vue.$snackbar.flash({ content: `Error - ${error}`, color: "error" });
      console.error(error);
      return false;
    }
  }
};

const namespaced = true;

export const authors: Module<IAuthorsState, IRootState> = {
  namespaced,
  state,
  getters,
  mutations,
  actions
};
