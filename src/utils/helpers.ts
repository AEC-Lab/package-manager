// import _ from "lodash";
import axios from "axios";

import { ipcRenderer } from "electron";
import fs from "fs-extra";
import path from "path";
import { GenericObject } from "types/github";
import { GithubRepository } from "types/package";

const helpers: { [key: string]: Function } = {};

helpers.ownerId = (repository: GenericObject) => {
  const owner = repository.owner.login;
  const id = repository.id;
  return `${owner}/${id}`;
};

/**
 * Get the repo owner name
 *
 * @param repository
 *
 * @returns - full_name of repo owner
 */
helpers.ownerName = (repository: GithubRepository) => {
  return repository.full_name;
};

/**
 *
 * @param path
 */
helpers.createActualPath = (path: string) => {
  // this function will parse a single environment variable from a string
  // marked with a '$' before the varialbe, and return the string
  return new Promise(resolve => {
    const dollar = path.indexOf("$");
    if (dollar !== -1) {
      const slash = path.indexOf("\\", dollar);
      let variable = "";
      if (slash === -1) {
        variable = path.substring(dollar - 1);
      } else {
        variable = path.substring(dollar - 1, slash);
      }
      const environmentVar = variable.substring(1);
      ipcRenderer.send("get-process-env-variable", environmentVar);
      ipcRenderer.once("environment-variable-found", (event, result) => {
        resolve(path.replace(variable, result));
      });
    } else {
      resolve(path);
    }
  });
};

helpers.validateSchema = async (schema: GenericObject) => {
  try {
    const url = process.env.VUE_APP_API + "/validate";
    const response = await axios.post(url, schema);
    const { data } = response;
    return !!data;
  } catch (error) {
    if (error.response.status === 500) {
      throw new Error("Server error... please try again later");
    } else if (error.response.status === 400) {
      throw new Error("Invalid schema: " + error.response.data);
    } else {
      throw new Error("Unknown error: " + error.response.data);
    }
  }
};

helpers.extractZip = async (sourcePath: string, destPath: string, isGithubSource: boolean) => {
  return new Promise((resolve, reject) => {
    ipcRenderer.send("extract-zip", { sourcePath, destPath, isGithubSource });
    ipcRenderer.once("extract-success", (event, sourceDirectoryName) => {
      resolve(sourceDirectoryName);
    });
    ipcRenderer.once("extract-failure", (event, error) => {
      console.log(error);
      reject(error);
    });
  });
};

helpers.cachedAssetsExist = async (cacheDirectory: string, packageFile: string): Promise<boolean> => {
  if (fs.existsSync(cacheDirectory)) {
    const pkgFilePath = path.join(cacheDirectory, packageFile);
    if (fs.existsSync(pkgFilePath)) {
      const instructions = fs.readJSONSync(pkgFilePath);
      const assetPaths: string[] = await Promise.all(
        instructions.uninstall.map((operation: any) => helpers.createActualPath(operation.source))
      );
      const uninstallSourcesExist = assetPaths.every((path: string) => fs.existsSync(path));
      if (uninstallSourcesExist) return true;
    }
  }
  return false;
};

export default helpers;
