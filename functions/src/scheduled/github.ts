import * as functions from "firebase-functions";
import * as _ from "lodash";
import { db } from "../config/fbConfig";
import { getOrganizationAdmins } from "../utils/github";
import { Author, GithubOrgConfig } from "../../../types/author";

export const syncGithubOrgAdmins = functions.pubsub.schedule("*/10 * * * *").onRun(async context => {
  const orgAuthors = await db
    .collection("authors")
    .where("sourceConfig.github.type", "==", "Organization")
    .get();
  if (orgAuthors.empty) return;
  for (const authorDoc of orgAuthors.docs) {
    const author = authorDoc.data() as Author;
    const srcConfig = author.sourceConfig.github as GithubOrgConfig;
    const fetchedAdmins = await getOrganizationAdmins(author.name, srcConfig.installationId);
    const storedAdmins = srcConfig.admins;
    if (_.isEqual(new Set(fetchedAdmins), new Set(storedAdmins))) continue;
    await authorDoc.ref.update({ "sourceConfig.github.admins": fetchedAdmins });
    console.log(`Updated admins list for ${srcConfig.name}`);
  }
});
