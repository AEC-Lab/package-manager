// import * as firebase from "firebase";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp(functions.config().firebase);

import { getGithubUsername } from "./utils";
import { User } from "./types";

const Validator = require("jsonschema").Validator;
import * as _ from "lodash";

// github webhook endpoint
exports.github = functions.https.onRequest((request: functions.https.Request, response: any) => {
  // handle invalid request method
  if (request.method !== "POST") {
    return response.status(405).send("Only POST Requests Are Accepted");
  }
  // allow only authorized github webhooks
  const eventHeader = request.get("X-GitHub-Event");
  const approvedHeaders = ["release", "installation_repositories"];
  if (eventHeader && !approvedHeaders.includes(eventHeader)) {
    return response.status(405).send(`Only Accepting GitHub Events: ${approvedHeaders}`);
  }
  // write data from github webhook to database
  const event = request.body;
  const promises: any[] = [];

  if (eventHeader === "installation_repositories") {
    const action = event.action;
    if (action === "added") {
      // add repository to database
      _.forEach(event.repositories_added, (repo: any) => {
        repo.users = ["user"];
        promises.push(
          admin
            .firestore()
            .collection("repositories")
            .doc(repo.id.toString())
            .set(repo)
        );
      });
    } else if (action === "removed") {
      // remove repository from database
      _.forEach(event.repositories_removed, (repo: any) => {
        promises.push(
          admin
            .firestore()
            .collection("repositories")
            .doc(repo.id.toString())
            .delete()
        );
      });
    }
  } else if (eventHeader === "release") {
    promises.push(
      admin
        .firestore()
        .collection("releases")
        .add(event)
    );
  }
  Promise.all(promises)
    .then(() => {
      return response.status(200).send("Done");
    })
    .catch(errors => {
      return errors;
    });
});

// validation endpoint for deployer data
exports.validate = functions.https.onRequest((request: functions.https.Request, response: any) => {
  // handle invalid request method
  if (request.method !== "POST") {
    return response.status(405).send("Only POST Requests Are Accepted");
  }
  const deployerData = request.body;
  const version = deployerData.schema;
  admin
    .firestore()
    .collection("schemas")
    .doc(version.toString())
    .get()
    .then(doc => {
      const schema = doc.data();
      const v = new Validator();
      const result = v.validate(deployerData, schema);
      result.valid ? response.status(200).send("Validated!") : response.status(400).send(result.errors);
    })
    .catch((error: string) => {
      console.error(new Error(error));
      response.status(500).send(`Cannot Find Schema Version: ${version}`);
    });
});

// cloud function to create user profile upon signin for the first time
exports.createUser = functions.auth.user().onCreate(async (user: admin.auth.UserRecord) => {
  const payload: User = {
    name: user.displayName || null,
    email: user.email || null,
    roles: ["user"],
    uid: user.uid
  };
  // If provider is GitHub, and user has no public name, use username for name
  if (user.providerData[0].providerId === "github.com" && !user.displayName) {
    payload.name = await getGithubUsername(user.providerData[0].uid);
  }
  return await admin
    .firestore()
    .collection("users")
    .doc(user.uid)
    .set(payload);
});

// cloud function to delete user metadata on auth delete
exports.deleteUser = functions.auth.user().onDelete(async (user: any) => {
  return await admin
    .firestore()
    .collection("users")
    .doc(user.uid)
    .delete();
});
