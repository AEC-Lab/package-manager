import { Module, GetterTree, MutationTree, ActionTree } from "vuex";
import fs from "fs";
import { machineIdSync } from "node-machine-id";
import { IRootState } from ".";
import { getUserDoc } from "../utils/fb";
import { PackageConfigCloud, PackageConfigFile, PackageConfigLocal } from "../../types/config";
import { ipcRenderer } from "electron";

export interface IConfigState {
  localConfig: PackageConfigFile | null;
  cloudConfig: PackageConfigCloud[];
  computerId: string;
  configPath: string;
}

export const state: IConfigState = {
  localConfig: null,
  cloudConfig: [],
  computerId: machineIdSync(),
  configPath: ""
};

export const getters: GetterTree<IConfigState, IRootState> = {
  getLocalConfig: state => {
    return state.localConfig;
  }
};

export const mutations: MutationTree<IConfigState> = {
  setLocalConfig(state, obj) {
    state.localConfig = obj;
  },
  setConfigPath(state, path) {
    state.configPath = path;
  },
  updateLocalConfig(state, { packageId, releaseId }) {
    const existingRecord = state.localConfig!.packages.find(record => record.packageId === packageId);
    if (existingRecord) {
      // state.localConfig!.packages
      existingRecord.releaseId = releaseId;
    } else {
      const newRecord: PackageConfigLocal = { packageId, releaseId };
      state.localConfig!.packages.push(newRecord);
    }
  },
  removeFromLocalConfig(state, packageId) {
    const filteredPackages = state.localConfig!.packages.filter(obj => obj.packageId !== packageId);
    state.localConfig!.packages = filteredPackages;
  },
  setCloudConfig(state, obj) {
    state.cloudConfig = obj;
  }
};

export const actions: ActionTree<IConfigState, IRootState> = {
  async loadLocalConfig(context) {
    const configPath: string = await new Promise(resolve => {
      ipcRenderer.send("get-config-path");
      ipcRenderer.once("config-path-found", (event, path) => resolve(path));
    });
    context.commit("setConfigPath", configPath);
    const configObj: PackageConfigFile = JSON.parse(fs.readFileSync(configPath, "utf8"));
    context.commit("setLocalConfig", configObj);
  },
  saveLocalConfig() {
    fs.writeFileSync(state.configPath, JSON.stringify(state.localConfig));
  },
  async addOrUpdatePackage(context, { packageId, releaseId }) {
    try {
      // Update user's Firestore document
      const userDoc = await getUserDoc();
      const docData = userDoc.data();
      const existingConfigArray: PackageConfigCloud[] = docData!.config;
      let updatedConfigArray: PackageConfigCloud[];
      if (!existingConfigArray) {
        // No package config array exists for user; create one with a first package
        updatedConfigArray = [{ packageId, releaseId, computerId: state.computerId }];
      } else if (
        !existingConfigArray.find(obj => obj.packageId === packageId && obj.computerId === state.computerId)
      ) {
        // Package for given computerId not found in user's cloud config; add package/compuerId combo object
        updatedConfigArray = existingConfigArray;
        updatedConfigArray.push({ packageId, releaseId, computerId: state.computerId });
      } else {
        // Package/computerId combo exists; update it with new release Id
        updatedConfigArray = existingConfigArray.map(obj => {
          if (obj.packageId === packageId && obj.computerId === state.computerId) {
            return {
              packageId,
              releaseId,
              computerId: state.computerId
            };
          } else return obj;
        });
      }
      await userDoc.ref.update({ config: updatedConfigArray });
      context.commit("setCloudConfig", updatedConfigArray);
    } catch (error) {
      console.log(error);
      throw error;
    }
    // Update local config file
    context.commit("updateLocalConfig", { packageId, releaseId });
    context.dispatch("saveLocalConfig");
  },
  async removePackage(context, packageId) {
    try {
      // Update user's Firestore document
      const userDoc = await getUserDoc();
      const docData = userDoc.data();
      const existingConfigArray: PackageConfigCloud[] = docData!.config;
      let updatedConfigArray: PackageConfigCloud[];
      if (!existingConfigArray) {
        // Not that this situation should ever happen...
        updatedConfigArray = [];
      } else {
        updatedConfigArray = existingConfigArray.filter(
          obj => obj.packageId !== packageId || obj.computerId !== state.computerId
        );
      }
      await userDoc.ref.update({ config: updatedConfigArray });
      context.commit("setCloudConfig", updatedConfigArray);
    } catch (error) {
      console.log(error);
      throw error;
    }
    context.commit("removeFromLocalConfig", packageId);
    context.dispatch("saveLocalConfig");
  }
};

const namespaced = true;

export const config: Module<IConfigState, IRootState> = {
  namespaced,
  state,
  getters,
  mutations,
  actions
};
