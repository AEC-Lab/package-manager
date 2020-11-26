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
  // handle non post requests
  if (request.method !== "POST") {
    return response.status(405).send("Only POST Requests Are Accepted");
  }

  const eventHeader = request.get("X-GitHub-Event");
  console.log("Event Header: ", eventHeader);

  // const approvedHeaders = ["release", "installation", "installation_repositories"];
  // if (eventHeader && !approvedHeaders.includes(eventHeader)) {
  //   console.error("Unsupported Event Header: ", eventHeader);
  //   return response.status(405).send(`Only Accepting GitHub Events: ${approvedHeaders}`);
  // }

  // write data from github webhook to database
  const event = request.body;
  const action = event.action;

  const promises: any[] = [];

  if (eventHeader === "installation_repositories") {
    if (action === "added") {
      // add each repository to database
      _.forEach(event.repositories_added, (repo: any) => {
        repo.users = ["user"];
        repo.source = "github";
        promises.push(
          admin
            .firestore()
            .collection("repositories")
            .doc(repo.id.toString())
            .set(repo)
        );
      });
    } else if (action === "removed") {
      // remove each repository from database
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
    // add release to database for client trigger to look for updates
    promises.push(
      admin
        .firestore()
        .collection("releases")
        .add(event)
    );
  } else if (eventHeader === "installation") {
    // add each repository to database
    if (action === "created") {
      _.forEach(event.repositories, (repo: any) => {
        repo.users = ["user"];
        repo.source = "github";
        promises.push(
          admin
            .firestore()
            .collection("repositories")
            .doc(repo.id.toString())
            .set(repo)
        );
      });
    } else if (action === "deleted") {
      // remove each repository from database
      _.forEach(event.repositories, (repo: any) => {
        promises.push(
          admin
            .firestore()
            .collection("repositories")
            .doc(repo.id.toString())
            .delete()
        );
      });
    }
  } else {
    // otherwise store event for debugging
    promises.push(
      admin
        .firestore()
        .collection(eventHeader || "")
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
