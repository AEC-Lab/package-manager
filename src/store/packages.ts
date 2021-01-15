import { PackageSource } from "../../types/enums";
import { Module, GetterTree, MutationTree, ActionTree } from "vuex";
import { IRootState } from ".";
import { GithubRepository, Package } from "../../types/package";
import { firestore } from "../integrations/firebase";
import Vue from "../main";

export interface IPackagesState {
  packages: Package[];
  isPackageListenerSet: boolean;
}

export const state: IPackagesState = {
  packages: [],
  isPackageListenerSet: false
};

export const getters: GetterTree<IPackagesState, IRootState> = {
  getPackageAdmins: (state, getters, rootState, rootGetters) => (pkg: Package): number[] => {
    return rootGetters["authors/getAuthorAdmins"](pkg.authorId);
  }
};

export const mutations: MutationTree<IPackagesState> = {
  setPackages(state, payload: Package[]) {
    state.packages = payload;
  },
  setPackageListener(state, payload) {
    state.isPackageListenerSet = payload;
  }
};

export const actions: ActionTree<IPackagesState, IRootState> = {
  /**
   *  Listen for package changes
   */
  packagesListener({ commit, dispatch }) {
    if (state.isPackageListenerSet) return;
    try {
      // Eventually we'll use conditionals based on permissions...
      const listener = firestore.collection("packages").onSnapshot(async snapshot => {
        const packages = snapshot.docs.map(doc => doc.data()) as Package[];
        commit("setPackages", packages);
        // Query and store releases belonging to the packages
        const githubReleaseDocIds = [];
        for (const pkg of packages) {
          if (pkg.source === PackageSource.Github) {
            const sourceData = pkg.sourceData as GithubRepository;
            for (const releaseId of sourceData.releases) {
              githubReleaseDocIds.push(releaseId);
            }
          } else if (pkg.source === PackageSource.Azure) {
            // TBD
          } else if (pkg.source === PackageSource.Url) {
            // TBD
          }
        }
        dispatch("github/fetchReleases", githubReleaseDocIds, { root: true });
      });
      commit("addListener", listener, { root: true });
      commit("setPackageListener", true);
    } catch (error) {
      // ! integrate with stack driver in cases like these!
      console.error(error);
    }
  },
  /**
   * Update package metadata in firebase
   * @param payload - package to update
   * @returns if package is updated successfully
   */
  async updatePackageData(context, payload: Package) {
    try {
      const srcData = payload.sourceData as GithubRepository;
      // update editable fields only
      await firestore
        .collection("packages")
        .doc(payload.id)
        .update({
          name: payload.name,
          description: payload.description,
          tags: payload.tags,
          images: payload.images,
          website: payload.website,
          status: payload.status,
          visibility: payload.visibility,
          "sourceData.releaseSetting": srcData.releaseSetting
        });
      Vue.$snackbar.flash({ content: "Package updated", color: "success" });
      return true;
    } catch (error) {
      Vue.$snackbar.flash({ content: `Error - ${error}`, color: "error" });
      console.error(error);
      return false;
    }
  }
};

const namespaced = true;

export const packages: Module<IPackagesState, IRootState> = {
  namespaced,
  state,
  getters,
  mutations,
  actions
};
