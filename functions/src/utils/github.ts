import * as functions from "firebase-functions";
import jwt from "jsonwebtoken";
import { Base64 } from "js-base64";
import axios from "axios";
import { GenericObject } from "../types";

// axios instance to be used for external Github API calls
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

export async function getGithubUsername(githubId: string) {
  try {
    const headers = { "Content-Type": "application/json" };
    const response = await $backend.get(`user/${githubId}`, { headers });
    return response.data.login;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function getRepoReleases(repo: any, event: any) {
  const token = await _getInstallationToken(event.installation.id);
  const Authorization = `token ${token}`;
  const headers = { Authorization };
  const response = await $backend.get(`repos/${repo.full_name}/releases`, { headers });
  const releases = response.data;
  releases.forEach((r: GenericObject) => (r.repository = repo.id));
  return releases;
}

export async function getOrganizationAdmins(org: string, installationId: number) {
  const token = await _getInstallationToken(installationId);
  const headers = { Authorization: `token ${token}` };
  const params = { role: "admin" };
  const url = `https://api.github.com/orgs/${org}/members`;
  const response = await $backend.get(url, { headers, params });
  return response.data.map((user: any) => user.id);
}

function _createJWT() {
  const token = jwt.sign({}, Base64.decode(functions.config().github.application_key), {
    algorithm: "RS256",
    issuer: functions.config().github.application_id,
    expiresIn: 10 * 60 - 30 // ten minutes, maximum expiration time per GitHub docs
  });
  return token;
}

async function _getInstallationToken(installationId: number) {
  const Authorization = `Bearer ${_createJWT()}`;
  const headers = { Authorization };
  const response = await $backend.post(`app/installations/${installationId}/access_tokens`, null, {
    headers
  });
  const token = response.data.token;
  return token;
}
