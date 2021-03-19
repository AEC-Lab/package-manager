import * as functions from "firebase-functions";
import * as _ from "lodash";

import { db } from "../config/fbConfig";
import { Package } from "../../../types/package";
import { Enterprise } from "../../../types/enterprise";
import { PackageVisibility } from "../../../types/enums";

export const handleEnterpriseDataChange = functions.firestore
  .document("enterprises/{docId}")
  .onUpdate(async (snapshot, context) => {
    const oldData = snapshot.before.data() as Enterprise;
    const newData = snapshot.after.data() as Enterprise;
    const enterpriseId = snapshot.after.id;
    try {
      // PACKAGECONFIG CHANGES (e.g. an Enterprise removes a package from its list of subscribed packages)
      const removedSubscriptions = Object.keys(oldData.packageConfig).filter(
        pkgId => !Object.keys(newData.packageConfig).includes(pkgId)
      );
      if (removedSubscriptions.length > 0) {
        for (const pkgId of removedSubscriptions) {
          const packageDoc = await db
            .collection("packages")
            .doc(pkgId)
            .get();
          const docData = packageDoc.data() as Package;
          // Remove enterprise id from subscribers (if package has subscriberId array, i.e. if it's Private)
          if (docData.subscriberIds) {
            docData.subscriberIds = docData.subscriberIds.filter(id => id !== enterpriseId);
            await packageDoc.ref.update({ subscriberIds: docData.subscriberIds });
          }
        }
      }

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  });

export const handleEnterpriseDeleted = functions.firestore
  .document("enterprises/{docId}")
  .onDelete(async (snapshot, context) => {
    // const docData = snapshot.data() as Enterprise;
    const enterpriseId = snapshot.id;

    try {
      // Remove enterprise as subscriber from any private packages in which it was listed
      const privatePackages = await db
        .collection("packages")
        .where("visibility", "==", PackageVisibility.Private)
        .get();
      privatePackages.forEach(async doc => {
        const pkg = doc.data() as Package;
        if (pkg.subscriberIds?.includes(enterpriseId)) {
          const updatedSubscriberIds = pkg.subscriberIds.filter(id => id !== enterpriseId);
          await doc.ref.update({ subscriberIds: updatedSubscriberIds });
        }
      });

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  });
