// import _ from "lodash";
// import ipcRenderer from "electron";

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

export default helpers;
