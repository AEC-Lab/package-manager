import { Module, GetterTree, MutationTree, ActionTree } from "vuex";
import store, { IRootState } from ".";
import { GenericObject } from "../../types/github";
import GitHub from "../integrations/github";
import helpers from "../utils/helpers";

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

export const getters: GetterTree<IGitHubState, IRootState> = {
  // Gets all releases for a given repository
  getReleasesByRepo: state => (repoId: number): GenericObject[] => {
    return state.releases.filter(release => release.repository === repoId);
  },
  // Gets the latest non-prerelease for a given repository
  getLatestRelease: (state, getters) => (repoId: number): GenericObject => {
    return getters
      .getReleasesByRepo(repoId)
      .sort((a: GenericObject, b: GenericObject) => +new Date(b.published_at) - +new Date(a.published_at))[0];
  },
  // Gets preleases published after the latest full release, for a given repository
  getLatestPrereleases: (state, getters) => (repoId: number): GenericObject[] => {
    return getters
      .getReleasesByRepo(repoId)
      .filter(
        (release: GenericObject) =>
          release.prerelease === true &&
          new Date(release.published_at) > new Date(store.getters.getLatestRelease(repoId).published_at)
      );
  }
};

export const mutations: MutationTree<IGitHubState> = {
  setRepositories(state, payload: GenericObject[]) {
    state.repositories.push(...payload);
  },
  setReleases(state, payload: GenericObject[]) {
    state.releases.push(...payload);
  },
  setInstallations(state, payload: GenericObject[]) {
    state.installations = payload;
  },
  clearRepositories(state) {
    state.repositories = [];
  },
  clearReleases(state) {
    state.releases = [];
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
  async getAsset(context, payload: GenericObject) {
    const { repository, assetId, releaseId } = payload;
    const encodedPath = `$TEMP\\${helpers.ownerName(repository).replace("/", "-")}-${releaseId}`;
    const actualPath = await helpers.createActualPath(encodedPath);
    const filePath = await GitHub.getAsset(repository, assetId, actualPath);
    return filePath;
  },
  async init({ commit, dispatch, state }) {
    commit("clearRepositories");
    commit("clearReleases");
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
