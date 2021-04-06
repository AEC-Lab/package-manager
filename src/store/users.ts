import { Module, GetterTree, MutationTree, ActionTree } from "vuex";
import { IRootState } from ".";
import { User } from "../../types/auth";
import { firestore } from "../integrations/firebase";
import Vue from "../main";

export interface IUsersState {
  users: User[];
  isUserListenerSet: boolean;
}

export const state: IUsersState = {
  users: [],
  isUserListenerSet: false
};

export const getters: GetterTree<IUsersState, IRootState> = {
  // Gets all users by the specified email domains
  getUsersByDomains: state => (domains: string[]): User[] => {
    return state.users.filter(user => {
      if (user.email) {
        const userDomain = user.email.split("@")[1];
        return domains.some(domain => domain === userDomain);
      } else {
        return false;
      }
    });
  },
  getUserByEmail: state => (email: string): User | null => {
    return state.users.find(user => user.email && user.email === email) || null;
  }
};

export const mutations: MutationTree<IUsersState> = {
  setUsers(state, payload: User[]) {
    state.users = payload;
  },
  setUserListener(state, payload) {
    state.isUserListenerSet = payload;
  }
};

export const actions: ActionTree<IUsersState, IRootState> = {
  /**
   * attach listeners for user changes
   */
  usersListener({ commit }) {
    if (state.isUserListenerSet) return;
    try {
      const listener = firestore.collection("users").onSnapshot(snapshot => {
        const users = snapshot.docs.map(doc => doc.data()) as User[];
        commit("setUsers", users);
      });
      commit("addListener", listener, { root: true });
      commit("setUserListener", true);
    } catch (error) {
      // ! integrate with stack driver in cases like these!
      console.error(error);
    }
  },
  async updateUserRoles(context, payload: User) {
    try {
      await firestore
        .collection("users")
        .doc(payload.uid)
        .update({
          roles: payload.roles
        });
      Vue.$snackbar.flash({ content: "User roles updated", color: "success" });
    } catch (error) {
      Vue.$snackbar.flash({ content: `Error - ${error}`, color: "error" });
      console.error(error);
      throw error;
    }
  }
};

const namespaced = true;

export const users: Module<IUsersState, IRootState> = {
  namespaced,
  state,
  getters,
  mutations,
  actions
};
