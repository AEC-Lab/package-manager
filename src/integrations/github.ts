const GitHub: { [key: string]: Function } = {};

import { Base64 } from "js-base64";
import axios from "axios";
import jwt from "jsonwebtoken";

import $store from "@/store";
import { find } from "lodash";
import helpers from "../utils/helpers";

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

GitHub.getReleases = async (repository: GenericObject) => {
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

// GitHub.getAsset = (repoName, assetId) => {
//   // using standard rquest library to avoid limitations with axios
//   return new Promise((resolve, reject) => {
//     GitHub.requestToken().then(token => {
//       const options = {
//         url: `https://api.github.com/repos/${repoName}/releases/assets/${assetId}`,
//         encoding: null,
//         headers: {
//           Authorization: `token ${token}`,
//           Accept: "application/octet-stream",
//           "User-Agent": "Package Manager"
//         }
//       };
//       requestPromise(options)
//         .then(asset => {
//           resolve(asset);
//         })
//         .catch(error => {
//           reject(error);
//         });
//     });
//   });
// };

// GitHub.getSource = (repoName, tagName) => {
//   // using standard rquest library to avoid limitations with axios
//   return new Promise((resolve, reject) => {
//     GitHub.requestToken().then(token => {
//       const options = {
//         url: `https://api.github.com/repos/${repoName}/zipball/${tagName}`,
//         encoding: null,
//         headers: {
//           Authorization: `token ${token}`,
//           Accept: "application/vnd.github.machine-man-preview+json",
//           "User-Agent": "Package Manager"
//         }
//       };
//       requestPromise(options)
//         .then(source => {
//           resolve(source);
//         })
//         .catch(error => {
//           reject(error);
//         });
//     });
//   });
// };

export default GitHub;
