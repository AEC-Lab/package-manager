// import * as firebase from "firebase";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp(functions.config().firebase);

import { getGithubUsername } from "./utils";

const helpers: { [key: string]: Function } = {};

// push data to a specific database
helpers.pushData = (path: string) => (payload: object) => {
  return new Promise((resolve, reject) => {
    admin
      .database()
      .ref(path)
      .push(payload)
      .then(snapshot => {
        resolve(snapshot);
      })
      .catch(error => {
        reject(error);
      });
  });
};

// get data from a specific reference
helpers.getData = (path: string) => {
  return new Promise((resolve, reject) => {
    admin
      .database()
      .ref(path)
      .once(
        "value",
        snapshot => {
          resolve(snapshot.val());
        },
        error => {
          reject(error);
        }
      );
  });
};

// delete data from a specific reference
helpers.deleteData = (path: string) => {
  return new Promise(resolve => {
    resolve(
      admin
        .database()
        .ref(path)
        .remove()
    );
  });
};

import { User, GenericObject } from "./types";

const Validator = require("jsonschema").Validator;
import * as _ from "lodash";

// github webhook endpoint
exports.github = functions.https.onRequest((request, response) => {
  // handle invalid request method
  if (request.method !== "POST") {
    return response.status(405).send("Only POST Requests Are Accepted");
  }
  // allow only authorized github webhooks
  const eventHeader = request.get("X-GitHub-Event");
  const approvedHeaders = ["release", "installation_repositories"];
  if (eventHeader && !approvedHeaders.includes(eventHeader)) {
    return response
      .status(405)
      .send(`Only Accepting GitHub Events: ${approvedHeaders}`);
  }
  // write data from github webhook to database
  const writeData = helpers.pushData(eventHeader)(request.body);
  // return write promise
  return writeData.then(
    (result: any) =>
      response.status(200).send(`Successfully Pushed Github Event: ${result}`),
    (error: any) =>
      response.status(500).send(`Error in Pushing GitHub Event: ${error}`)
  );
});

// validation endpoint for deployer data
// TODO store deployer schemas in google firestore!
exports.validate = functions.https.onRequest(
  (request: functions.https.Request, response: GenericObject) => {
    // handle invalid request method
    if (request.method !== "POST") {
      return response.status(405).send("Only POST Requests Are Accepted");
    }
    const deployerData = request.body;
    const version = deployerData.version;
    helpers
      .getData("schemas")
      .then((schemas: object[]) => {
        const schema = _.find(schemas, ["version", version]) as GenericObject;
        if (schema) {
          const v = new Validator();
          const result = v.validate(deployerData, schema.schema);
          result.valid
            ? response.status(200).send("Validated!")
            : response.status(400).send(result.errors);
        } else {
          response
            .status(400)
            .send(`Can't Find a Deployer Schema With Version ${version}`);
        }
      })
      .catch((error: string) => {
        response
          .status(500)
          .send(`Error Getting Deployer Schemas to Validate With: ${error}`);
      });
  }
);

// delete the release event, deletion event will trigger client to update live
exports.processReleaseEvent = functions.database
  .ref("/release/{key}")
  .onCreate((snapshot: any) => {
    return snapshot.ref.remove();
  });

// process repository event from github app installation
exports.processRepositoryEvent = functions.database
  .ref("/installation_repositories/{key}")
  .onCreate((snapshot: any) => {
    const event = snapshot.val();
    const allowedActions = ["added", "removed"];
    const action = event.action;
    const promises: any[] = [];

    if (!allowedActions.includes(action)) {
      console.error(new Error(`Unknown Repository Event Action: ${action}`));
      return;
    } else if (action === "added") {
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
    Promise.all(promises)
      .then(() => {
        return snapshot.ref.remove();
      })
      .catch(errors => {
        return errors;
      });
  });

// cloud function to create user profile upon signin for the first time
exports.createUser = functions.auth
  .user()
  .onCreate(async (user: admin.auth.UserRecord) => {
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
