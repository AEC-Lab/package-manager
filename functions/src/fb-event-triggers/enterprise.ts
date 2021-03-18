import * as functions from "firebase-functions";
import * as _ from "lodash";

import { db } from "../config/fbConfig";
import { Package } from "../../../types/package";
import { Enterprise } from "../../../types/enterprise";

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
