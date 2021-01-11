import { Module, GetterTree, MutationTree, ActionTree } from "vuex";
import { IRootState } from ".";
import { GenericObject } from "../../types/github";
import { Package, GithubRepository } from "../../types/package";
import GitHub from "../integrations/github";
import helpers from "../utils/helpers";
import fs from "fs-extra";
import { firestore } from "../integrations/firebase";

export interface IGitHubState {
  releases: GenericObject[];
}

export const state: IGitHubState = {
  releases: []
};

export const getters: GetterTree<IGitHubState, IRootState> = {
  /**
   * Gets all releases for a given package
   * @param pkg - package to get releases
   * @returns releases of the package
   */
  getReleasesByPackage: state => (pkg: Package): GenericObject[] => {
    const srcData = pkg.sourceData as GithubRepository;
    return state.releases
      .filter(release => srcData.releases.includes(release._id))
      .sort((a: GenericObject, b: GenericObject) => +new Date(b.published_at) - +new Date(a.published_at));
  },
  // Gets the latest non-prerelease for a given package
  getLatestRelease: (state, getters) => (pkg: Package): GenericObject => {
    return getters
      .getReleasesByPackage(pkg)
      .filter((release: GenericObject) => release.prerelease === false)
      .sort((a: GenericObject, b: GenericObject) => +new Date(b.published_at) - +new Date(a.published_at))[0];
  },
  // Gets latest release plus subsequent prereleases
  getLatestAndPrereleases: (state, getters) => (pkg: Package): GenericObject[] => {
    return getters
      .getReleasesByPackage(pkg)
      .filter(
        (release: GenericObject) =>
          new Date(release.published_at) >= new Date(getters.getLatestRelease(pkg).published_at)
      );
  }
};

export const mutations: MutationTree<IGitHubState> = {
  setReleases(state, payload: GenericObject[]) {
    state.releases = payload;
  }
};

export const actions: ActionTree<IGitHubState, IRootState> = {
  /**
   * Get asset filepath from the package
   * @async
   * @param payload
   * @returns asset path
   */
  async getAsset(context, payload: any) {
    const {
      pkg,
      assetId,
      assetName,
      releaseId
    }: { pkg: Package; assetId: number; assetName: string; releaseId: number } = payload;
    const encodedPath = `$TEMP\\${helpers.ownerName(pkg.sourceData).replace("/", "-")}-${releaseId}`;
    const actualPath = await helpers.createActualPath(encodedPath);
    const fp = actualPath + `\\${assetName}`;
    if (fs.existsSync(fp)) fs.unlinkSync(fp); // remove file if present
    const filePath = await GitHub.getAsset(pkg.sourceData, assetId, actualPath);
    return filePath;
  },
  /**
   * Get release metadata from firebase. Commits releases to state
   * @param releaseIds
   */
  async fetchReleases({ commit }, releaseIds: string[]) {
    const releaseDocs = await Promise.all(
      releaseIds.map(id =>
        firestore
          .collection("releases")
          .doc(id)
          .get()
      )
    );
    const releases = releaseDocs.map(r => {
      return {
        _id: r.id,
        ...r.data()
      };
    });
    commit("setReleases", releases);
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
