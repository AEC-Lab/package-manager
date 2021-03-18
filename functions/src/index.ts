import * as functions from "firebase-functions";

import bodyParser from "body-parser";
import express, { Router } from "express";
import cors from "cors";

import githubRoute from "./routes/github";
import validateRoute from "./routes/validate";

//////////////////////////////////////////
///////// HTTP REQUEST FUNCTIONS /////////
//////////////////////////////////////////

const options: cors.CorsOptions = {
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "X-Access-Token",
    "Access-Control-Allow-Origin"
  ],
  methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
  origin: "*",
  preflightContinue: false
};

// Creates an Express app that can be assigned to a cloud function endpoint
function configureApp(router: Router) {
  const app = express();
  app.use(cors(options));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.options("*", cors(options));
  app.use("/", router);
  return app;
}

export const github = functions.https.onRequest(configureApp(githubRoute));
export const validate = functions.https.onRequest(configureApp(validateRoute));

//////////////////////////////////////
/////////  FIREBASE TRIGGERS /////////
//////////////////////////////////////

export { createUser, deleteUser } from "./fb-event-triggers/auth";
export { processGithubEvent } from "./fb-event-triggers/github";
export { handlePackageDataChange } from "./fb-event-triggers/package";
export { handleEnterpriseDataChange } from "./fb-event-triggers/enterprise";

////////////////////////////////////////////
///////// HTTPS CALLABLE FUNCTIONS /////////
////////////////////////////////////////////

export { isUserEmailVerified } from "./callables/auth";
export {
  generateRequestCode,
  getEnterpriseNameByRequestCode,
  processSubscriptions
} from "./callables/enterprise";

///////////////////////////////////////
///////// SCHEDULED FUNCTIONS /////////
///////////////////////////////////////

export { syncGithubOrgAdmins } from "./scheduled/github";
export { removeExpiredRequests } from "./scheduled/enterprise";
