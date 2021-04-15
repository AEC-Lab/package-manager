import * as functions from "firebase-functions";
import jwt from "jsonwebtoken";
import { auth, db } from "../config/fbConfig";
import { User } from "../../../types/auth";
import { UserRole } from "../../../types/enums";

export const isUserEmailVerified = functions.https.onCall(async (data, context) => {
  try {
    const email: string = data.email;
    const existingUser = await auth.getUserByEmail(email);
    return existingUser && existingUser.emailVerified;
  } catch (error) {
    console.log(error);
    throw error;
  }
});

export const getAuthUsers = functions.https.onCall(async (data, context) => {
  // ensure that request comes from an authenticated, SuperAdmin user
  const requesterUid = context.auth?.uid;
  if (!requesterUid) throw new functions.https.HttpsError("unauthenticated", "Unauthenticated request");
  const userDoc = await db
    .collection("users")
    .doc(requesterUid)
    .get();
  const userData = userDoc.data() as User;
  if (!userData.roles.includes(UserRole.SuperAdmin))
    throw new functions.https.HttpsError(
      "permission-denied",
      "Requester does not have the required permissions."
    );

  const userRecords: any[] = [];
  const listAllUsers = async (nextPageToken?: string) => {
    // List batch of users, 1000 at a time.
    try {
      const listUsersResult = await auth.listUsers(1000, nextPageToken);
      listUsersResult.users.forEach(userRecord => {
        // userRecords.push(userRecord.toJSON());
        userRecords.push({
          uid: userRecord.uid,
          providers: userRecord.providerData.map(provider => provider.providerId)
        });
      });
      if (listUsersResult.pageToken) {
        // List next batch of users.
        listAllUsers(listUsersResult.pageToken);
      }
    } catch (error) {
      console.log("Error listing users:", error);
    }
  };
  await listAllUsers();

  return userRecords;
});

/**
 * Creates a custom auth token given a JSON web token (e.g. access_token, id_token returned from an external identity provider)
 */
export const createCustomToken = functions.https.onCall(async (data, context) => {
  try {
    const jwtString: string = data.jwt;
    const decodedJwt = jwt.decode(jwtString) as { [key: string]: any };
    const { oid } = decodedJwt;
    const customToken = await auth.createCustomToken(oid);
    return customToken && customToken;
  } catch (error) {
    console.log(error);
    throw error;
  }
});
