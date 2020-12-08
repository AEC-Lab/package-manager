import * as functions from "firebase-functions";
import { auth } from "../config/fbConfig";

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
