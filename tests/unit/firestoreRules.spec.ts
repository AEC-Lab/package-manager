import firebase from "@firebase/rules-unit-testing";

const FB_PROJECT_ID = process.env.VUE_APP_PROJECTID;

describe("firestore", () => {
  it("can read items in the read-only collection", async () => {
    const db = firebase.initializeTestApp({ projectId: FB_PROJECT_ID }).firestore();
    const doc = db.collection("packages").doc();
    await firebase.assertSucceeds(doc.get());
  });
});
