import { Module, MutationTree, ActionTree, GetterTree } from "vuex";
import { IRootState } from ".";
import { Enterprise } from "../../types/enterprise";
import { firestore } from "../integrations/firebase";
import Vue from "../main";

export interface IEnterprisesState {
  enterprises: Enterprise[];
  isEnterpriseListenerSet: boolean;
}

export const state: IEnterprisesState = {
  enterprises: [],
  isEnterpriseListenerSet: false
};

export const getters: GetterTree<IEnterprisesState, IRootState> = {
  // Gets all releases for a given repository
  getEnterpriseNameById: state => (enterpriseId: string): string => {
    const enterprise = state.enterprises.find(enterprise => enterprise.id === enterpriseId);
    return enterprise ? enterprise.name : "Unknown";
  }
};

export const mutations: MutationTree<IEnterprisesState> = {
  setEnterprises(state, payload: Enterprise[]) {
    state.enterprises = payload;
  },
  setEnterpriseListener(state, payload) {
    state.isEnterpriseListenerSet = payload;
  }
};

export const actions: ActionTree<IEnterprisesState, IRootState> = {
  /**
   * attach listeners for Enterprise changes
   */
  enterprisesListener({ commit }) {
    if (state.isEnterpriseListenerSet) return;
    try {
      const listener = firestore.collection("enterprises").onSnapshot(snapshot => {
        const enterprises = snapshot.docs.map(doc => doc.data()) as Enterprise[];
        commit("setEnterprises", enterprises);
      });
      commit("addListener", listener, { root: true });
      commit("setEnterpriseListener", true);
    } catch (error) {
      // ! integrate with stack driver in cases like these!
      console.error(error);
    }
  },
  /**
   * Create Enterprise object in Firebase
   * @param payload - Enterprise object data
   * @returns if update was successful
   */
  async createEnterprise(context, payload: Enterprise) {
    try {
      const newDoc = firestore.collection("enterprises").doc();
      const enterpriseObj: Enterprise = {
        ...payload,
        id: newDoc.id
      };
      await newDoc.set(enterpriseObj);
      Vue.$snackbar.flash({ content: "Enterprise created", color: "success" });
      return true;
    } catch (error) {
      Vue.$snackbar.flash({ content: `Error - ${error}`, color: "error" });
      console.error(error);
      return false;
    }
  },
  /**
   * Update Enterprise metadata in firebase
   * @param payload - Enterprise metadata
   * @returns if update was successful
   */
  async updateEnterpriseData(context, payload: Enterprise) {
    try {
      // update editable fields only
      const eDoc = firestore.collection("enterprises").doc(payload.id);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...data } = payload;
      await eDoc.update(data);
      Vue.$snackbar.flash({ content: "Enterprise updated", color: "success" });
      return true;
    } catch (error) {
      Vue.$snackbar.flash({ content: `Error - ${error}`, color: "error" });
      console.error(error);
      return false;
    }
  },
  /**
   * Delete an Enterprise in firebase
   * @param enterpriseId - Enterprise document id
   * @returns if update was successful
   */
  async deleteEnterprise(context, enterpriseId: string) {
    try {
      await firestore
        .collection("enterprises")
        .doc(enterpriseId)
        .delete();
      Vue.$snackbar.flash({ content: "Enterprise deleted", color: "success" });
      return true;
    } catch (error) {
      Vue.$snackbar.flash({ content: `Error - ${error}`, color: "error" });
      console.error(error);
      return false;
    }
  }
};

const namespaced = true;

export const enterprises: Module<IEnterprisesState, IRootState> = {
  namespaced,
  state,
  getters,
  mutations,
  actions
};
