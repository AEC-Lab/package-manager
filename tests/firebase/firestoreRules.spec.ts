require("dotenv").config();
import * as firebase from "@firebase/rules-unit-testing";
import { expect } from "chai";
import { User } from "../../types/auth";
import { Author } from "../../types/author";
import { PackageSource, PackageStatus, PackageVisibility } from "../../types/enums";
import { Package } from "../../types/package";

const FB_PROJECT_ID = process.env.VUE_APP_PROJECTID;
const myIdGithub = "github_user_abc";
const theirIdGithub = "github_user_xyz";
const myIdEmail = "email_user_abc";
const myAuthGithub = { uid: myIdGithub };
const theirAuthGithub = { uid: theirIdGithub };
const myAuthEmail = { uid: myIdEmail };

const myUserDocGithub: User = {
  uid: myIdGithub,
  email: "",
  name: "",
  roles: [],
  config: [],
  githubId: 333
};

const theirUserDocGithub: User = {
  uid: theirIdGithub,
  email: "",
  name: "",
  roles: [],
  config: [],
  githubId: 987
};

const myUserDocEmail: User = {
  uid: myIdEmail,
  email: "my@email.com",
  name: "",
  roles: [],
  config: []
};

const githubPackagePublic: Package = {
  id: "package_abc_1",
  name: "",
  description: "",
  authorId: "author_abc",
  tags: [],
  images: [],
  website: "",
  status: PackageStatus.Active,
  visibility: PackageVisibility.Public,
  source: PackageSource.Github,
  sourceData: {},
  dependencyIds: []
};

const githubPackageAuthor: Author = {
  id: "author_abc",
  name: "Acme Co.",
  description: "",
  website: "",
  thumbnailUrl: "",
  sourceConfig: {
    github: {
      id: 12345,
      name: "Acme-Github",
      type: "Organization",
      installed: true,
      installationId: 99999,
      admins: [111, 222, 333, 444, 555]
    }
  }
};

function getFirestore(auth: any) {
  return firebase.initializeTestApp({ projectId: FB_PROJECT_ID, auth: auth }).firestore();
}

function getAdminFirestore() {
  return firebase.initializeAdminApp({ projectId: FB_PROJECT_ID }).firestore();
}

async function initializeTestDocs(userDoc: User) {
  const admin = getAdminFirestore();
  const promises = [
    admin
      .collection("packages")
      .doc(githubPackagePublic.id)
      .set(githubPackagePublic),
    admin
      .collection("authors")
      .doc(githubPackageAuthor.id)
      .set(githubPackageAuthor),
    admin
      .collection("users")
      .doc(userDoc.uid)
      .set(userDoc)
  ];
  return await Promise.all(promises);
}

beforeEach(async () => {
  await firebase.clearFirestoreData({ projectId: FB_PROJECT_ID! });
});

describe("firestore", () => {
  it("can read .env file variables", () => {
    expect(process.env.VUE_APP_PROJECTID).equals("package-manager-development");
  });

  ////////////////////////////////
  //   USERS COLLECTION TESTS   //
  ////////////////////////////////
  it("can write to a user document with an id matching the authenticated user's uid", async () => {
    const db = getFirestore(myAuthGithub);
    const testDoc = db.collection("users").doc(myIdGithub);
    await firebase.assertSucceeds(testDoc.set({ foo: "bar" }));
  });

  it("cannot write to a user document with an id different from the authenticated user's uid", async () => {
    const db = getFirestore(myAuthGithub);
    const testDoc = db.collection("users").doc(theirIdGithub);
    await firebase.assertFails(testDoc.set({ foo: "bar" }));
  });

  ///////////////////////////////////
  //   PACKAGES COLLECTION TESTS   //
  ///////////////////////////////////
  it("cannot read packages while not authenticated", async () => {
    const db = getFirestore(null);
    const testDoc = db.collection("packages").doc();
    await firebase.assertFails(testDoc.get());
  });

  it("can write to a package for which the authenticated user is an admin to the package's source Github org", async () => {
    await initializeTestDocs(myUserDocGithub);
    const db = getFirestore(myAuthGithub);
    const testDoc = db.collection("packages").doc(githubPackagePublic.id);
    await firebase.assertSucceeds(testDoc.update({ foo: "bar" }));
  });

  it("cannot write to a package for which the authenticated user is NOT an admin to the package's source Github org", async () => {
    await initializeTestDocs(theirUserDocGithub);
    const db = getFirestore(theirAuthGithub);
    const testDoc = db.collection("packages").doc(githubPackagePublic.id);
    await firebase.assertFails(testDoc.update({ foo: "bar" }));
  });

  it("cannot write to a github-sourced package by a non-github user", async () => {
    await initializeTestDocs(myUserDocEmail);
    const db = getFirestore(myAuthEmail);
    const testDoc = db.collection("packages").doc(githubPackagePublic.id);
    await firebase.assertFails(testDoc.update({ foo: "bar" }));
  });

  //////////////////////////////////
  //   AUTHORS COLLECTION TESTS   //
  //////////////////////////////////
  it("cannot read authors while not authenticated", async () => {
    const db = getFirestore(null);
    const testDoc = db.collection("authors").doc();
    await firebase.assertFails(testDoc.get());
  });

  it("can write to a author doc for which the authenticated user is an admin of the source Github org", async () => {
    await initializeTestDocs(myUserDocGithub);
    const db = getFirestore(myAuthGithub);
    const testDoc = db.collection("authors").doc(githubPackageAuthor.id);
    await firebase.assertSucceeds(testDoc.update({ foo: "bar" }));
  });

  it("cannot write to an author doc for which the authenticated user is NOT an admin of the source Github org", async () => {
    await initializeTestDocs(theirUserDocGithub);
    const db = getFirestore(theirAuthGithub);
    const testDoc = db.collection("authors").doc(githubPackageAuthor.id);
    await firebase.assertFails(testDoc.update({ foo: "bar" }));
  });

  it("cannot write to a github-sourced package by a non-github user", async () => {
    await initializeTestDocs(myUserDocEmail);
    const db = getFirestore(myAuthEmail);
    const testDoc = db.collection("authors").doc(githubPackageAuthor.id);
    await firebase.assertFails(testDoc.update({ foo: "bar" }));
  });

  ///////////////////////////////////
  //   RELEASES COLLECTION TESTS   //
  ///////////////////////////////////
  it("cannot read releases while not authenticated", async () => {
    const db = getFirestore(null);
    const testDoc = db.collection("releases").doc("random_doc");
    await firebase.assertFails(testDoc.get());
  });

  it("can read releases while authenticated", async () => {
    const db = getFirestore(myAuthEmail);
    const testDoc = db.collection("releases").doc("random_doc");
    await firebase.assertSucceeds(testDoc.get());
  });

  it("cannot write to releases", async () => {
    const db = getFirestore(myAuthGithub);
    const testDoc = db.collection("releases").doc("random_doc");
    await firebase.assertFails(testDoc.update({ foo: "bar" }));
  });

  //////////////////////////////////
  //   SCHEMAS COLLECTION TESTS   //
  //////////////////////////////////
  it("cannot read schemas while not authenticated", async () => {
    const db = getFirestore(null);
    const testDoc = db.collection("schemas").doc("random_doc");
    await firebase.assertFails(testDoc.get());
  });

  it("cannot write to schemas", async () => {
    const db = getFirestore(myAuthGithub);
    const testDoc = db.collection("schemas").doc("random_doc");
    await firebase.assertFails(testDoc.update({ foo: "bar" }));
  });
});

after(async () => {
  // await firebase.clearFirestoreData({ projectId: FB_PROJECT_ID! });
  // return;
});
