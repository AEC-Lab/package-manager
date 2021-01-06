const GitHub: { [key: string]: Function } = {};

import { Base64 } from "js-base64";
import axios from "axios";
import jwt from "jsonwebtoken";
import { ipcRenderer } from "electron";

import helpers from "../utils/helpers";

import { GithubRepository } from "types/package";
import { GenericObject } from "types/github";

const $backend = axios.create({
  baseURL: "https://api.github.com",
  timeout: 30000,
  headers: {
    Accept: "application/vnd.github.machine-man-preview+json"
  }
});

// stubs for request and response interceptors if needed
$backend.interceptors.request.use(config => config);
$backend.interceptors.response.use(
  response => response,
  error => error
);

// this environment variable is a base64 encoded PEM file (from GitHub app page)
// https://www.base64encode.org/
const APPLICATIONKEY = Base64.decode(process.env.VUE_APP_GITHUBAPPLICATIONKEY || "");
const APPLICATIONID = process.env.VUE_APP_GITHUBAPPLICATIONID;

const createJWT = () => {
  const token = jwt.sign({}, APPLICATIONKEY, {
    algorithm: "RS256",
    issuer: APPLICATIONID,
    expiresIn: 10 * 60 - 30 // ten minutes, maximum expiration time per GitHub docs
  });
  return token;
};

GitHub.getInstallationToken = async (installationId: string) => {
  const Authorization = `Bearer ${createJWT()}`;
  const headers = { Authorization };
  const response = await $backend.post(`app/installations/${installationId}/access_tokens`, null, {
    headers
  });
  const token = response.data.token;
  return token;
};

GitHub.getAsset = async (repository: GenericObject, assetId: string, directoryPath: string) => {
  // Get API url and token for asset, then pass to electron-dl to download
  const token = await GitHub.getInstallationToken(repository.sourceData.installationId);
  const ownerName = helpers.ownerName(repository.sourceData);
  const url = `https://api.github.com/repos/${ownerName}/releases/assets/${assetId}`;
  console.log(`Downloading asset ${assetId}...`);
  return new Promise((resolve, reject) => {
    ipcRenderer.send("download-private-asset", {
      url: url,
      token: token,
      assetId,
      properties: { directory: directoryPath, saveAs: false }
    });
    ipcRenderer.on(`download-success-${assetId}`, (event, savePath) => {
      console.log(`File downloaded to ${savePath}`);
      resolve(savePath);
    });
    ipcRenderer.on(`download-failure-${assetId}`, (event, error) => {
      console.log(error);
      reject(error);
    });
  });
};

export default GitHub;
