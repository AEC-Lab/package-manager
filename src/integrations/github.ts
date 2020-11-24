const GitHub: { [key: string]: Function } = {};

import { Base64 } from "js-base64";
import axios from "axios";
import jwt from "jsonwebtoken";
// import { GenericObject } from "../../types/github";

// creates an axios backend for github api calls
const $backend = axios.create({
  baseURL: "https://api.github.com",
  timeout: 30000,
  headers: {
    Accept: "application/vnd.github.machine-man-preview+json"
  }
});

$backend.interceptors.request.use(async config => {
  // fetches new token on every github request - could improve this logic
  const token = await requestToken();
  config.headers["Authorization"] = `token ${token}`;
  return config;
});

$backend.interceptors.response.use(
  response => response,
  async error => {
    console.error(new Error(error));
    return error;
  }
);

// this environment variable is a base64 encoded PEM file (from GitHub app page)
// https://www.base64encode.org/
const applicationKey = Base64.decode(process.env.VUE_APP_GITHUBAPPLICATIONKEY || "");
const applicationId = process.env.VUE_APP_GITHUBAPPLICATIONID;
const installationId = process.env.VUE_APP_GITHUBINSTALLATIONID;

const generateJWT = () => {
  const token = jwt.sign({}, applicationKey, {
    algorithm: "RS256",
    issuer: applicationId,
    expiresIn: 20 // seconds
  });
  return token;
};

const requestToken = async () => {
  const url = `https://api.github.com/app/installations/${installationId}/access_tokens`;
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${generateJWT()}`,
      Accept: "application/vnd.github.machine-man-preview+json",
      "User-Agent": "Package Manager"
    }
  };
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data.token;
  } catch (error) {
    throw new Error(error);
  }
};

GitHub.getRepositories = () => {
  return new Promise((resolve, reject) => {
    $backend.get("installation/repositories").then(
      response => resolve(response.data.repositories),
      error => reject(error)
    );
  });
};

GitHub.getReleases = (repoName: string) => {
  return new Promise((resolve, reject) => {
    $backend.get(`repos/${repoName}/releases`).then(
      response => resolve(response.data),
      error => reject(error)
    );
  });
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
//           "User-Agent": "Dot Deployer"
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
//           "User-Agent": "Dot Deployer"
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
