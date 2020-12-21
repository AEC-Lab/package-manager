// import _ from "lodash";
import { ipcRenderer } from "electron";

import { GenericObject } from "types/github";

const helpers: { [key: string]: Function } = {};

helpers.ownerId = (repository: GenericObject) => {
  const owner = repository.owner.login;
  const id = repository.id;
  return `${owner}/${id}`;
};

helpers.ownerName = (repository: GenericObject) => {
  return repository.full_name;
};

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

export default helpers;
