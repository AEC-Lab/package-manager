const GitHub: { [key: string]: Function } = {};

import { Base64 } from "js-base64";
import axios from "axios";
import jwt from "jsonwebtoken";
import { ipcRenderer } from "electron";

import helpers from "../utils/helpers";

import { GithubRepository } from "types/package";

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

GitHub.getAsset = async (repository: GithubRepository, assetId: string, directoryPath: string) => {
  const token = await GitHub.getInstallationToken(repository.installationId);
  const ownerName = helpers.ownerName(repository);
  const url = `https://api.github.com/repos/${ownerName}/releases/assets/${assetId}`;
  console.log(`Downloading asset ${assetId}...`);
  return new Promise((resolve, reject) => {
    ipcRenderer.send(`download-github-asset`, {
      url: url,
      token: token,
      assetId,
      acceptType: "application/octet-stream",
      properties: {
        directory: directoryPath,
        saveAs: false
      }
    });
    ipcRenderer.once(`download-success-${assetId}`, (event, savePath) => {
      console.log(`File downloaded to ${savePath}`);
      resolve(savePath);
    });
    ipcRenderer.once(`download-failure-${assetId}`, (event, error) => {
      console.log(error);
      reject(error);
    });
  });
};

GitHub.getSource = async (repository: GithubRepository, sourceUrl: string, directoryPath: string) => {
  const token = await GitHub.getInstallationToken(repository.installationId);
  const assetId = "source";
  return new Promise((resolve, reject) => {
    ipcRenderer.send(`download-github-asset`, {
      url: sourceUrl,
      token: token,
      assetId: assetId,
      acceptType: "application/vnd.github.machine-man-preview+json",
      properties: { directory: directoryPath, saveAs: false }
    });
    ipcRenderer.once(`download-success-${assetId}`, (event, savePath) => {
      console.log(`Source .zip downloaded to ${savePath}`);
      resolve(savePath);
    });
    ipcRenderer.once(`download-failure-${assetId}`, (event, error) => {
      console.log(error);
      reject(error);
    });
  });
};

export default GitHub;
