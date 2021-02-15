import store from "../store";
import { PackageConfigLocal } from "../../types/config";
import { ButtonConfigEnum, ButtonActions } from "../../types/enums";
import { GenericObject } from "types/github";
import { ProcessConfig } from "types/install";
import GitHub from "../integrations/github";

import _ from "lodash";
import fs from "fs-extra";
import path from "path";
import { spawnSync } from "child_process";

import psList from "ps-list";
import helpers from "../utils/helpers";

const PACKAGE_FILE = "package.ship";
import Vue from "../main";
import { Package } from "types/package";

/**
 * Gets button configurations for the package
 *
 * @param pkg - package
 *
 * @returns the corresponding button configuration
 */
export const getButtonConfig = (pkg: Package) => {
  const existingInstall: PackageConfigLocal | undefined = store.state.config.localConfig.packages.find(
    (obj: PackageConfigLocal) => obj.packageId === pkg.id
  );
  const latestRelease = store.getters["github/getLatestRelease"](pkg);
  if (!latestRelease) return ButtonConfigs[ButtonActions.DISABLED]; // In reality there should be no packages without releases
  if (existingInstall) {
    if (existingInstall.releaseId === latestRelease.id) {
      return ButtonConfigs[ButtonActions.UNINSTALL];
    } else return ButtonConfigs[ButtonActions.UPDATE];
  } else return ButtonConfigs[ButtonActions.INSTALL];
};

/**
 * Dispatches asset downloads
 *
 * @param assets
 * @param releasePackage
 * @param pkg
 *
 */
const downloadHandler = async (assets: GenericObject[], releasePackage: GenericObject, pkg: Package) => {
  for (const asset of assets) {
    const payload = {
      assetId: asset.id,
      releaseId: releasePackage.id,
      assetName: asset.name,
      pkg
    };
    // TODO: add switch depending on package source (github | azure | url, etc.)
    await store.dispatch("github/getAsset", payload);
  }
};

/**
 * Installs package
 *
 * @param pkg - package to install
 * @param [release] - release to install
 *
 * @throws err - no release package found
 * @throws err - install failed
 *
 */
export const installPackage = async (pkg: Package, release?: GenericObject) => {
  let releasePackage: GenericObject;
  if (!release) {
    releasePackage = await store.getters["github/getLatestRelease"](pkg);
  } else releasePackage = release;
  if (!releasePackage) {
    throw new Error("No release found for this package");
  }

  // Check if any dependencies exist and are installed
  if (pkg.dependencyIds && pkg.dependencyIds.length) {
    const missingDependencies = findMissingDependencies(pkg);
    if (missingDependencies.length) {
      console.log(`Missing ${missingDependencies.length} dependencies: `, missingDependencies);
      const pkgNameString = missingDependencies
        .map(
          (pkg: Package) => `&#8226 ${pkg.name} (${store.getters["authors/getAuthorNameById"](pkg.authorId)})`
        )
        .join("\n");
      const response = await Vue.$confirm(
        `The following dependencies for this package were not found on your system. Would you like to install them automatically?\n\n${pkgNameString}`,
        {
          title: "Package Dependencies",
          buttonTrueText: "Yes, please!",
          buttonFalseText: "No thanks",
          color: "info",
          icon: ""
        }
      );
      if (response) {
        // Install missing dependencies
        Vue.$snackbar.flash({ content: "Installing dependencies...", color: "info" });
        await Promise.all(missingDependencies.map((pkg: Package) => installPackage(pkg)));
        Vue.$snackbar.flash({ content: "Dependencies installed. Installing package...", color: "info" });
        console.log("dependencies installed!");
      }
    }
  }

  const { assets, zipball_url } = releasePackage;
  await downloadHandler(assets, releasePackage, pkg);

  const encodedPath = `$TEMP\\${helpers.ownerName(pkg.sourceData).replace("/", "-")}-${releasePackage.id}`;
  const actualPath = await helpers.createActualPath(encodedPath);
  try {
    const instructions = fs.readJSONSync(`${actualPath}\\${PACKAGE_FILE}`);
    console.log("validating schema");
    await helpers.validateSchema(instructions);
    // for future support of other package versions
    if (instructions.version == 1) {
      // 1.  check for open processes
      console.log("checking for processes");
      await checkForProcessesOpen(instructions.processes);

      // 2.  process uninstall
      const existingInstall: PackageConfigLocal | undefined = store.state.config.localConfig.packages.find(
        (obj: PackageConfigLocal) => obj.packageId === pkg.id
      );

      if (existingInstall) {
        console.log("uninstalling");
        await uninstallOperation(instructions.uninstall, actualPath);
      }

      // 3.  process install
      console.log("installing based on instructions");
      await installOperation(instructions.install, actualPath, zipball_url, pkg);
    }
  } catch (err) {
    throw new Error(err);
  }

  await store.dispatch("config/addOrUpdatePackage", {
    packageId: pkg.id,
    releaseId: releasePackage.id
  });
};

/**
 * Uninstalls package
 *
 * @param pkg - package to be uninstalled
 * @param [release] - release to uninstall
 *
 * @throws err - no release found
 * @throws err - uninstall failure
 */
export const uninstallPackage = async (pkg: Package, release?: GenericObject) => {
  let releasePackage: GenericObject;
  if (!release) {
    releasePackage = await store.getters["github/getLatestRelease"](pkg);
  } else releasePackage = release;
  if (!releasePackage) {
    throw new Error("No release found for this pkg");
  }
  const { assets } = releasePackage;
  const encodedPath = `$TEMP\\${helpers.ownerName(pkg.sourceData).replace("/", "-")}-${releasePackage.id}`;
  const actualPath = await helpers.createActualPath(encodedPath);

  // Check to see if cached assets still exist; otherwise, re-download
  if (!(await helpers.cachedAssetsExist(actualPath, PACKAGE_FILE))) {
    await downloadHandler(assets, releasePackage, pkg);
  } else {
    console.log("Cached assets found");
  }

  try {
    const instructions = fs.readJSONSync(`${actualPath}\\${PACKAGE_FILE}`);
    console.log("validating schema");
    await helpers.validateSchema(instructions);
    // for future support of other package versions
    if (instructions.version == 1) {
      // 1.  check that dependencies are installed?

      // 2.  check for open processes
      console.log("checking for processes");
      await checkForProcessesOpen(instructions.processes);

      // 3.  process uninstall
      console.log("uninstalling");
      await uninstallOperation(instructions.uninstall, actualPath);

      // 4. delete temp folder
      console.log("deleting temp folder");
      fs.removeSync(actualPath);
    }
  } catch (err) {
    throw new Error(err);
  }

  await store.dispatch("config/removePackage", pkg.id);
};

/**
 * Install Button Configurations
 */
export const ButtonConfigs: ButtonConfigEnum = {
  INSTALL: {
    text: "Install",
    color: "primary",
    handler: async (event: Event, pkg: Package) => {
      event.stopPropagation();
      try {
        await installPackage(pkg);
        Vue.$snackbar.flash({ content: `Successfully installed ${pkg.name}`, color: "success" });
      } catch (error) {
        Vue.$snackbar.flash({ content: `Error downloading ${pkg.name} - ${error}`, color: "error" });
      }
    }
  },
  UNINSTALL: {
    text: "Uninstall",
    color: "success",
    handler: async (event: Event, pkg: Package) => {
      event.stopPropagation();
      try {
        await uninstallPackage(pkg);
        Vue.$snackbar.flash({ content: `Successfully uninstalled ${pkg.name}`, color: "success" });
      } catch (error) {
        Vue.$snackbar.flash({ content: `Error uninstalling ${pkg.name} - ${error}`, color: "error" });
      }
    }
  },
  UPDATE: {
    text: "Update",
    color: "warning",
    handler: async (event: Event, pkg: Package) => {
      event.stopPropagation();
      try {
        await installPackage(pkg);
        Vue.$snackbar.flash({ content: `Successfully updated ${pkg.name}`, color: "success" });
      } catch (error) {
        Vue.$snackbar.flash({ content: `Error updating ${pkg.name} - ${error}`, color: "error" });
      }
    }
  },
  DISABLED: {
    text: "Disabled",
    color: "grey",
    handler: (event: Event) => {
      event.stopPropagation();
    }
  }
};

/**
 * Checks for open processes
 *
 * @param processes
 */
const checkForProcessesOpen = async (processes: ProcessConfig[]) => {
  if (!processes || !processes.length) return;
  psList().then(openProcesses => {
    for (const i in processes) {
      const currentlyOpen = _.find(openProcesses, ["name", processes[i].name]);
      if (currentlyOpen) throw new Error(`Please close ${currentlyOpen.name} first!`);
    }
    return;
  });
};

/**
 * get the file extension of an asset string
 *
 * @param asset - string path of asset
 *
 * @returns extension of asset
 */
const getExtension = (asset: string) => {
  const substringArray = asset.split(".");
  return substringArray[substringArray.length - 1];
};

/**
 *
 * @param operations
 * @param parentPath
 */
const installOperation = async (
  operations: GenericObject[],
  parentPath: string,
  sourceUrl: string,
  pkg: Package
) => {
  for (const i in operations) {
    const operation = operations[i];
    const sourcePath = await helpers.createActualPath(operation.source);
    const tempFilePath = `${parentPath}\\${sourcePath}`;
    if (operation.action === "download-source-code") {
      const sourceZipPath = await GitHub.getSource(pkg.sourceData, sourceUrl, parentPath);
      try {
        const extractedDirectoryName = await helpers.extractZip(sourceZipPath, parentPath, true);
        const renameSource = path.join(parentPath, extractedDirectoryName);
        const renameDest = path.join(parentPath, sourcePath);
        // Remove existing source code folder if exists from previous install, otherwise rename will fail
        if (fs.existsSync(renameDest)) {
          fs.removeSync(renameDest);
        }
        await new Promise(resolve => setTimeout(() => resolve(null), 100)); // delay added to ensure resource available to write to
        fs.renameSync(renameSource, renameDest);
      } catch (error) {
        console.log(error);
        throw new Error(error);
      }
    } else if (operation.action === "copy") {
      const decodedPath = await helpers.createActualPath(operation.destination);
      const destFilePath = `${decodedPath}\\${path.basename(sourcePath)}`;
      const extension = getExtension(sourcePath);
      if (extension === "zip" || extension === "tar" || extension === "gz") {
        try {
          helpers.extractZip(tempFilePath, decodedPath, false);
        } catch (error) {
          throw new Error(error);
        }
      } else {
        fs.copySync(tempFilePath, destFilePath);
      }
    } else if (operation.action === "run") {
      spawnSync("cmd.exe", ["/c", tempFilePath]);
    }
  }
  return;
};

const uninstallOperation = async (operations: GenericObject[], parentPath: string) => {
  for (const i in operations) {
    const operation = operations[i];
    const fileName = await helpers.createActualPath(operation.source);

    if (operation.action === "delete") {
      // delete file on file system
      try {
        fs.removeSync(fileName);
      } catch (error) {
        console.log("file to delete is not present");
      }
    } else if (operation.action === "run") {
      // run a file in local temp directory
      const filePath = await helpers.createActualPath(`${parentPath}\\${fileName}`);
      // await shell.openExternal(filePath);  // <-- can't get this to work on test package
      spawnSync("cmd.exe", ["/c", filePath]);
    }
  }
  return;
};

const findMissingDependencies = (pkg: Package) => {
  // TODO: check for recursive dependencies (i.e., a dependency of a dependency), and merge into one list
  const installedPackageIds: string[] = store.state.config.localConfig.packages.map(
    (config: PackageConfigLocal) => config.packageId
  );
  const missingPackageIds = pkg.dependencyIds.filter(pkgId => !installedPackageIds.includes(pkgId));
  return missingPackageIds.map(id => store.getters["packages/getPackageById"](id)).filter(pkg => pkg);
};
