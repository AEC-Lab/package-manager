import { Request } from "express";
import * as _ from "lodash";

import { db } from "../config/fbConfig";

// @desc    github webhook endpoint
// @route   POST /github
// @access  Public
export const processGithubAppAction = (request: Request, response: any) => {
  if (request.method !== "POST") return response.status(405).send("Only POST Requests Are Accepted");

  const eventHeader = request.get("X-GitHub-Event");
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
          db
            .collection("repositories")
            .doc(repo.id.toString())
            .set(repo)
        );
      });
    } else if (action === "removed") {
      // remove each repository from database
      _.forEach(event.repositories_removed, (repo: any) => {
        promises.push(
          db
            .collection("repositories")
            .doc(repo.id.toString())
            .delete()
        );
      });
    }
  } else if (eventHeader === "release") {
    // add release to database for client trigger to look for updates
    promises.push(db.collection("releases").add(event));
  } else if (eventHeader === "installation") {
    // add each repository to database
    if (action === "created") {
      _.forEach(event.repositories, (repo: any) => {
        repo.users = ["user"];
        repo.source = "github";
        promises.push(
          db
            .collection("repositories")
            .doc(repo.id.toString())
            .set(repo)
        );
      });
    } else if (action === "deleted") {
      // remove each repository from database
      _.forEach(event.repositories, (repo: any) => {
        promises.push(
          db
            .collection("repositories")
            .doc(repo.id.toString())
            .delete()
        );
      });
    }
  } else {
    // otherwise store event for debugging
    promises.push(db.collection(eventHeader || "").add(event));
  }
  Promise.all(promises)
    .then(() => {
      return response.status(200).send("Done");
    })
    .catch(errors => {
      return errors;
    });
};
