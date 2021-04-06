import * as functions from "firebase-functions";
import * as _ from "lodash";

import { db } from "../config/fbConfig";
import { Package } from "../../../types/package";
import { Enterprise } from "../../../types/enterprise";
import { PackageVisibility } from "../../../types/enums";

export const handlePackageDataChange = functions.firestore
  .document("packages/{docId}")
  .onUpdate(async (snapshot, context) => {
    const oldData = snapshot.before.data() as Package;
    const newData = snapshot.after.data() as Package;
    const packageId = snapshot.after.id;
    try {
      // VISIBILITY CHANGES
      if (
        oldData.visibility === PackageVisibility.Public &&
        newData.visibility === PackageVisibility.Private
      ) {
        // PUBLIC >> PRIVATE: remove references in Enterprise packageConfig and memberConfig objects
        const querySnapshot = await db.collection("enterprises").get();
        querySnapshot.forEach(async doc => {
          const docData = doc.data() as Enterprise;
          if (packageId in docData.packageConfig) {
            const updatedDocData = removePackageFromEnterprise(docData, packageId);
            await doc.ref.update({
              packageConfig: updatedDocData.packageConfig,
              memberConfig: updatedDocData.memberConfig
            });
          }
        });
      } else if (
        oldData.visibility === PackageVisibility.Private &&
        newData.visibility === PackageVisibility.Public
      ) {
        // PRIVATE >> PUBLIC: package's subscriberIds array will be removed
        // (this is already handled directly in the PackageEdit component, no need to add logic here at the moment)
      }

      // SUBSCRIBER CHANGES (only if package is Private)
      if (
        oldData.subscriberIds !== newData.subscriberIds &&
        newData.visibility === PackageVisibility.Private
      ) {
        if (oldData.subscriberIds) {
          const newDataSubscriberIds = newData.subscriberIds || [];
          const removedSubscriberIds = oldData.subscriberIds.filter(id => !newDataSubscriberIds.includes(id));
          for (const subscriberId of removedSubscriberIds) {
            const enterpriseDoc = await db
              .collection("enterprises")
              .doc(subscriberId)
              .get();
            const docData = enterpriseDoc.data() as Enterprise;
            const updatedDocData = removePackageFromEnterprise(docData, packageId);
            await enterpriseDoc.ref.update({
              packageConfig: updatedDocData.packageConfig,
              memberConfig: updatedDocData.memberConfig
            });
          }
        }
      }

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  });

function removePackageFromEnterprise(enterpriseData: Enterprise, packageId: string) {
  // delete package id from packageConfig object
  delete enterpriseData.packageConfig[packageId];
  // filter out package id from memberConfig array objects, if any
  for (const member in enterpriseData.memberConfig) {
    enterpriseData.memberConfig[member] = enterpriseData.memberConfig[member].filter(
      pkgId => pkgId !== packageId
    );
  }
  return enterpriseData;
}
