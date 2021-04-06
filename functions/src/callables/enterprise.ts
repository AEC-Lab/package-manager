import * as functions from "firebase-functions";
import { db } from "../config/fbConfig";
import { EnterprisePackageRequest, Enterprise } from "../../../types/enterprise";
import { EnterprisePackageAccess } from "../../../types/enums";
import { Package } from "../../../types/package";

export const generateRequestCode = functions.https.onCall(async (data, context) => {
  try {
    const enterpriseId: string = data.enterpriseId;
    const docData: EnterprisePackageRequest = {
      enterpriseId,
      created: new Date()
    };
    const requestDoc = await db.collection("enterprise_package_requests").add(docData);
    return requestDoc.id;
  } catch (error) {
    console.log(error);
    throw error;
  }
});

export const getEnterpriseNameByRequestCode = functions.https.onCall(async (data, context) => {
  try {
    const requestCode: string = data.requestCode;
    const requestDoc = await db
      .collection("enterprise_package_requests")
      .doc(requestCode)
      .get();
    if (!requestDoc.exists) throw new functions.https.HttpsError("not-found", "The request code has expired");
    const requestData = requestDoc.data() as EnterprisePackageRequest;
    const enterpriseId = requestData.enterpriseId;
    const enterpriseDoc = await db
      .collection("enterprises")
      .doc(enterpriseId)
      .get();
    if (!enterpriseDoc.exists) throw new functions.https.HttpsError("not-found", "Enterprise not found");
    const enterpriseData = enterpriseDoc.data() as Enterprise;
    return enterpriseData.name;
  } catch (error) {
    console.log(error);
    throw error;
  }
});

export const processSubscriptions = functions.https.onCall(async (data, context) => {
  try {
    // get data passed in
    const { requestCode, packageIds }: { requestCode: string; packageIds: string[] } = data;

    // 1. get enterpriseId from request doc
    const requestDoc = await db
      .collection("enterprise_package_requests")
      .doc(requestCode)
      .get();
    if (!requestDoc.exists) throw new functions.https.HttpsError("not-found", "The request code has expired");
    const requestData = requestDoc.data() as EnterprisePackageRequest;
    const enterpriseId = requestData.enterpriseId;

    // 2. add enterpriseId to package's subscriber array
    for (const pkgId of packageIds) {
      const packageDoc = await db
        .collection("packages")
        .doc(pkgId)
        .get();
      const packageData = packageDoc.data() as Package;
      const packageSubscribers = packageData.subscriberIds || [];
      packageSubscribers.push(enterpriseId);
      await packageDoc.ref.update({ subscriberIds: packageSubscribers });
    }

    // 3. add packageId(s) to list of enterprise's subscriptions
    const enterpriseDoc = await db
      .collection("enterprises")
      .doc(enterpriseId)
      .get();
    if (!enterpriseDoc.exists) throw new functions.https.HttpsError("not-found", "Enterprise not found");
    const updateData: { [key: string]: EnterprisePackageAccess } = {};
    for (const pkgId of packageIds) {
      updateData[`packageConfig.${pkgId}`] = EnterprisePackageAccess.Default;
    }
    await enterpriseDoc.ref.update(updateData);

    // 4. delete request code doc from Firestore
    await requestDoc.ref.delete();

    return;
  } catch (error) {
    console.log(error);
    throw error;
  }
});
