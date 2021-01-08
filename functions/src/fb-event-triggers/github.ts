import * as functions from "firebase-functions";
import * as _ from "lodash";
import jwt from "jsonwebtoken";
import { Base64 } from "js-base64";
import axios from "axios";

import { db } from "../config/fbConfig";
import { GithubRepository, Package } from "../../../types/package";
import { Author } from "../../../types/author";
import { PackageReleaseSetting, PackageSource, PackageStatus, PackageVisibility } from "../../../types/enums";
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

export const processGithubEvent = functions.firestore
  .document("gh_webhook_queue/{docId}")
  .onCreate(async (snapshot, context) => {
    const eventHeader = snapshot.data().headers["x-github-event"];
    const event = snapshot.data().body;
    const action = event.action;
    const promises: any[] = [];

    switch (eventHeader) {
      case "installation":
        if (action === "created") {
          // create new 'author' doc in Firestore first, corresponding to the organization installed on
          await _createAuthor(event);
          // add each repository to database
          _.forEach(event.repositories, (repo: any) => {
            promises.push(_createPackage(repo, event));
          });
        } else if (action === "deleted") {
          // remove each repository from database
          _.forEach(event.repositories, (repo: any) => {
            promises.push(_removePackage(repo));
          });
          // remove 'author' doc from Firestore
          promises.push(_removeAuthor(event));
        }
        break;
      case "installation_repositories":
        if (action === "added") {
          // add each repository to database
          _.forEach(event.repositories_added, (repo: any) => {
            promises.push(_createPackage(repo, event));
          });
        } else if (action === "removed") {
          // remove each repository from database
          _.forEach(event.repositories_removed, (repo: any) => {
            promises.push(_removePackage(repo));
          });
        }
        break;
      case "release":
        // adding slight delay b/c the GH webhook appears to fire multiple release events (i.e. 'created', 'published', 'released') in short succession at times
        await new Promise(resolve => setTimeout(() => resolve(null), 1000));
        // add release to database for client trigger to look for updates
        promises.push(_addOrUpdateReleaseDoc(event));
        break;
      default:
        // otherwise store event for debugging
        promises.push(db.collection(eventHeader || "").add(event));
    }

    try {
      await Promise.all(promises);
      // Delete queued doc if processing successful
      await snapshot.ref.delete();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  });

// PRIVATE FUNCTIONS
async function _createAuthor(event: any) {
  const newAuthorDoc = db.collection("authors").doc();
  const authorObject: Author = {
    id: newAuthorDoc.id,
    name: event.installation.account.login,
    description: "",
    website: event.installation.account.html_url,
    thumbnailUrl: event.installation.account.avatar_url,
    sourceConfig: {
      github: {
        id: event.installation.account.id,
        installed: true,
        name: event.installation.account.login,
        admins: []
      }
    }
  };
  return await newAuthorDoc.set(authorObject);
}

async function _removeAuthor(event: any) {
  const authorDocQuery = await db
    .collection("authors")
    .where("sourceConfig.github.id", "==", event.installation.account.id)
    .get();
  if (authorDocQuery.empty) return;
  const authorDoc = authorDocQuery.docs[0];

  // return await authorDoc.ref.update({ "sourceConfig.github.installed": false })
  // In the future, when a Github app is uninstalled, we may want to update the author doc instead of deleting it completely;
  // e.g. if an author has multiple sources (Github, Azure, URL, etc.), we would want to leave it in place for those other sources

  return await authorDoc.ref.delete();
}

async function _createPackage(repo: any, event: any) {
  const newPackageDocRef = db.collection("packages").doc();
  const existingReleases = await _getRepoReleases(repo, event);
  const releaseDocIds = await _createReleaseDocs(existingReleases);
  const authorDocQuery = await db
    .collection("authors")
    .where("sourceConfig.github.id", "==", event.installation.account.id)
    .get();
  const authorId = authorDocQuery.empty ? "" : authorDocQuery.docs[0].id;

  const githubRepoData: GithubRepository = {
    ownerId: event.installation.account.id,
    installationId: event.installation.id,
    releases: releaseDocIds,
    releaseSetting: PackageReleaseSetting.LatestAndPrerelease,
    ...repo
  };

  const newPackage: Package = {
    id: newPackageDocRef.id,
    name: repo.name,
    description: "",
    tags: [],
    images: [],
    website: "",
    status: PackageStatus.Inactive,
    visibility: repo.private ? PackageVisibility.Private : PackageVisibility.Public,
    source: PackageSource.Github,
    sourceData: githubRepoData,
    authorId: authorId
  };

  // TO DELETE >>> //
  // repo.users = ["user"];
  // repo.source = "github";
  // const newRepoDoc = db
  //   .collection("repositories")
  //   .doc(repo.id.toString())
  //   .set(repo);
  // <<< TO DELETE //

  const newPackageDocPromise = newPackageDocRef.set(newPackage);

  // return Promise.all([newPackageDocPromise, newRepoDoc]);
  return newPackageDocPromise;
}

async function _removePackage(repo: any) {
  const promises: any[] = [];

  const packageDocQuery = await db
    .collection("packages")
    .where("source", "==", PackageSource.Github)
    .where("sourceData.id", "==", repo.id)
    .get();
  packageDocQuery.forEach(doc => promises.push(doc.ref.delete()));

  // Also remove any release docs associated with the repo
  // (alternatively, we could reference docIds directly from the package doc's releases array)
  const releaseDocQuery = await db
    .collection("releases")
    .where("repository", "==", repo.id)
    .get();
  releaseDocQuery.forEach(doc => promises.push(doc.ref.delete()));

  promises.push(
    db
      .collection("repositories")
      .doc(repo.id.toString())
      .delete()
  );

  return Promise.all(promises);
}

async function _addOrUpdateReleaseDoc(event: any) {
  const promises: any[] = [];

  const existingReleaseDocQuery = await db
    .collection("releases")
    .where("repository", "==", event.repository.id)
    .where("id", "==", event.release.id)
    .get();

  const packageDocQuery = await db
    .collection("packages")
    .where("source", "==", PackageSource.Github)
    .where("sourceData.id", "==", event.repository.id)
    .get();

  // Early return if a package doc doesn't exist for the corresponding repo (this shouldn't happen)
  if (packageDocQuery.empty) return;
  const packageDoc = packageDocQuery.docs[0];
  let packageReleaseArray = packageDoc.data().sourceData.releases;

  if (existingReleaseDocQuery.empty) {
    // Release doc doesn't exist && action != "delete" >> create doc, and add docId to corresponding package release array
    if (event.action == "deleted" || event.release.draft) return; // ignore unpublished drafts
    const release = { repository: event.repository.id, ...event.release }; // Add custom field for future use
    const newDoc = db.collection("releases").doc();
    promises.push(newDoc.set(release));
    packageReleaseArray.push(newDoc.id);
    promises.push(packageDoc.ref.update({ "sourceData.releases": packageReleaseArray }));
  } else {
    const releaseDoc = existingReleaseDocQuery.docs[0];
    if (event.action == "deleted") {
      // Delete existing release doc and remove from packageDoc's release array
      promises.push(releaseDoc.ref.delete());
      packageReleaseArray = packageReleaseArray.filter((id: string) => id !== releaseDoc.id);
      promises.push(packageDoc.ref.update({ "sourceData.releases": packageReleaseArray }));
    } else if (event.release.draft) {
      // Skip unpublished drafts (take no action); this is unlikely to ever hit
      return;
    } else {
      // Update/overwrite existing release doc with new data from webhook
      promises.push(releaseDoc.ref.update({ ...event.release }));
    }
  }

  return Promise.all(promises);
}

async function _getRepoReleases(repo: any, event: any) {
  const token = await _getInstallationToken(event.installation.id);
  const Authorization = `token ${token}`;
  const headers = { Authorization };
  const response = await $backend.get(`repos/${repo.full_name}/releases`, { headers });
  const releases = response.data;
  releases.forEach((r: GenericObject) => (r.repository = repo.id));
  return releases;
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

async function _createReleaseDocs(releases: any[]) {
  const docIds: string[] = [];
  const promises: any[] = [];
  for (const release of releases) {
    const docRef = db.collection("releases").doc();
    docIds.push(docRef.id);
    promises.push(docRef.set(release));
  }
  await Promise.all(promises);
  return docIds;
}
