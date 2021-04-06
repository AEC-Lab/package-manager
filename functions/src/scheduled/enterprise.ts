import * as functions from "firebase-functions";
import admin, { db } from "../config/fbConfig";
import { EnterprisePackageRequest } from "../../../types/enterprise";

// runs every 10 minutes
export const removeExpiredRequests = functions.pubsub.schedule("*/10 * * * *").onRun(async context => {
  const MAX_LIFE = 10; // # of days after which documents will be deleted

  const enterpriseRequests = await db.collection("enterprise_package_requests").get();
  if (enterpriseRequests.empty) return;
  for (const requestDoc of enterpriseRequests.docs) {
    const requestData = requestDoc.data() as EnterprisePackageRequest;
    const timeDiffMillis =
      new Date().getTime() -
      new Date(((requestData.created as unknown) as admin.firestore.Timestamp).toMillis()).getTime();
    const timeDiffDays = timeDiffMillis / 1000 / 60 / 60 / 24;
    if (timeDiffDays >= MAX_LIFE) {
      await requestDoc.ref.delete();
    }
  }
});
