// import _ from "lodash";
import axios from "axios";

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

export default helpers;
