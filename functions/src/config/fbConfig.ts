import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (process.env.FUNCTIONS_EMULATOR && !process.env.FIRESTORE_EMULATOR_HOST) {
  // RUN LOCAL FUNCTIONS EMULATORS CONNECT WITH PRODUCTION FIRESTORE
  // from 'npm run serve'
  console.log(__dirname);
  const serviceAccount = require("../../../../firebase_credentials/ServiceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://package-manager-development.firebaseio.com"
  });
} else {
  // RUN ON PRODUCTION
  // from 'npm run serveall'
  admin.initializeApp(functions.config().firebase);
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
