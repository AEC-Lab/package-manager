import { firestore, fireAuth } from "../integrations/firebase";

export const getUserDoc = async () => {
  if (!fireAuth.currentUser) throw new Error("No user signed in");
  const userDoc = await firestore
    .collection("users")
    .doc(fireAuth.currentUser.uid)
    .get();
  if (!userDoc.exists) throw new Error("No user doc exists");
  return userDoc;
};
