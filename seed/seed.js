require("dotenv").config();
// eslint-disable-next-line
const admin = require("firebase-admin");

// eslint-disable-next-line
const serviceAccount = require("./service-account-production.json");

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://package-manager-417d1.firebaseio.com" // production!
});

// eslint-disable-next-line
const schema_1 = require("./schema_1.json");

// As an admin, the app has access to read and write all data, regardless of Security Rules
const schemas = admin.firestore().collection("schemas");

schemas
  .doc("1")
  .set(schema_1)
  .then(snapshot => {
    console.log("Snapshot: ", snapshot);
  });
