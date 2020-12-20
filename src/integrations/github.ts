const GitHub: { [key: string]: Function } = {};

import { Base64 } from "js-base64";
import axios from "axios";
import jwt from "jsonwebtoken";
import { ipcRenderer } from "electron";

import $store from "@/store";
import { find } from "lodash";
import helpers from "../utils/helpers";

import { GenericObject } from "types/github";
import { Repository } from "types/repos";

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

GitHub.getInstallations = async () => {
  const Authorization = `Bearer ${createJWT()}`;
  const headers = { Authorization };
  const response = await $backend.get("app/installations", { headers });
  const installations = response.data;
  const promises = installations.map(
    async (i: GenericObject) => (i.token = await GitHub.getInstallationToken(i.id))
  );
  await Promise.all(promises);
  return installations;
};

GitHub.getRepositories = async (installation: GenericObject) => {
  const Authorization = `token ${installation.token}`;
  const headers = { Authorization };
  const response = await $backend.get("installation/repositories", { headers });
  const repositories = response.data.repositories;
  repositories.forEach((r: GenericObject) => (r.installation = installation.id));
  return repositories;
};

GitHub.getReleases = async (repository: Repository) => {
  const { installation } = repository;
  const token = find($store.state.github.installations, ["id", installation]).token;
  const Authorization = `token ${token}`;
  const headers = { Authorization };
  const id = helpers.ownerName(repository);
  const response = await $backend.get(`repos/${id}/releases`, { headers });
  const releases = response.data;
  releases.forEach((r: GenericObject) => (r.repository = repository.id));
  return releases;
};

GitHub.getAsset = async (repository: Repository, assetId: string, directoryPath: string) => {
  // Get API url and token for asset, then pass to electron-dl to download
  const r = find($store.state.github.repositories, ["id", repository.id]);
  const { installation } = r;
  const token = find($store.state.github.installations, ["id", installation]).token;
  const ownerName = helpers.ownerName(repository);
  const url = `https://api.github.com/repos/${ownerName}/releases/assets/${assetId}`;
  console.log(`Downloading asset ${assetId}...`);
  ipcRenderer.send("download-private-asset", {
    url: url,
    token: token,
    assetId,
    properties: { directory: directoryPath }
  });
  ipcRenderer.on(`download-success-${assetId}`, (event, savePath) => {
    console.log(`File downloaded to ${savePath}`);
    return savePath;
  });
  ipcRenderer.on(`download-failure-${assetId}`, (event, error) => {
    console.log(error);
  });
};

export default GitHub;
