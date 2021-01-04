import { Module, MutationTree } from "vuex";
import { IRootState } from ".";

export interface ISnackbarState {
  content: string;
  color: string;
  timeout: number;
}

export const state: ISnackbarState = {
  content: "",
  color: "",
  timeout: 5000
};

export const mutations: MutationTree<ISnackbarState> = {
  flash(state, payload) {
    state.content = payload.content;
    state.color = payload.color;
    state.timeout = payload.timeout;
  }
};

const namespaced = true;

export const snackbar: Module<ISnackbarState, IRootState> = {
  namespaced,
  state,
  mutations
};
