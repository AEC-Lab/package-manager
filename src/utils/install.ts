import store from "../store";
import { PackageConfigLocal } from "../../types/config";
import { ButtonConfigEnum, ButtonActions } from "../../types/enums";
import { GenericObject } from "types/github";
import { ProcessConfig } from "types/install";

import _ from "lodash";
import fs from "fs-extra";
import { shell } from "electron";
import extract from "extract-zip";

import psList from "ps-list";
import helpers from "../utils/helpers";

const packageFile = "manage.package";
import Vue from "../main";
import { Package } from "types/package";

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

export const installPackage = async (pkg: Package, release?: GenericObject) => {
  let releasePackage: GenericObject;
  if (!release) {
    releasePackage = await store.getters["github/getLatestRelease"](pkg);
  } else releasePackage = release;
  if (!releasePackage) {
    throw new Error("No release found for this package");
  }
  const { assets } = releasePackage;
  await downloadHandler(assets, releasePackage, pkg);

  const encodedPath = `$TEMP\\${helpers.ownerName(pkg.sourceData).replace("/", "-")}-${releasePackage.id}`;
  const actualPath = await helpers.createActualPath(encodedPath);
  try {
    const instructions = fs.readJSONSync(`${actualPath}\\${packageFile}`);
    console.log("validating schema");
    await helpers.validateSchema(instructions);
    // for future support of other package versions
    if (instructions.version == 1) {
      // 1.  check that dependencies are installed?

      // 2.  check for open processes
      console.log("checking for processes");
      await checkForProcessesOpen(instructions.processes);

      // 3.  process uninstall
      const existingInstall: PackageConfigLocal | undefined = store.state.config.localConfig.packages.find(
        (obj: PackageConfigLocal) => obj.packageId === pkg.id
      );

      if (existingInstall) {
        console.log("uninstalling");
        await uninstallOperation(instructions.uninstall, actualPath);
      }

      // 4.  process install
      console.log("installing based on instructions");
      await installOperation(instructions.install, actualPath);
    }
  } catch (err) {
    throw new Error(err);
  }

  await store.dispatch("config/addOrUpdatePackage", {
    packageId: pkg.id,
    releaseId: releasePackage.id
  });
};

export const uninstallPackage = async (pkg: Package, release?: GenericObject) => {
  let releasePackage: GenericObject;
  if (!release) {
    releasePackage = await store.getters["github/getLatestRelease"](pkg);
  } else releasePackage = release;
  if (!releasePackage) {
    throw new Error("No release found for this pkg");
  }
  const { assets } = releasePackage;
  await downloadHandler(assets, releasePackage, pkg);
  const encodedPath = `$TEMP\\${helpers.ownerName(pkg.sourceData).replace("/", "-")}-${releasePackage.id}`;
  const actualPath = await helpers.createActualPath(encodedPath);

  try {
    const instructions = fs.readJSONSync(`${actualPath}\\${packageFile}`);
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
    }
  } catch (err) {
    throw new Error(err);
  }

  await store.dispatch("config/removePackage", pkg.id);
};

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

const getExtension = (asset: string) => {
  const substringArray = asset.split(".");
  return substringArray[substringArray.length - 1];
};

const installOperation = async (operations: GenericObject[], parentPath: string) => {
  for (const i in operations) {
    const operation = operations[i];
    const fileName = await helpers.createActualPath(operation.source);
    const tempFilePath = `${parentPath}\\${fileName}`;

    if (operation.action === "copy") {
      const decodedPath = await helpers.createActualPath(operation.destination);
      const destFilePath = `${decodedPath}\\${fileName}`;
      fs.copyFileSync(tempFilePath, destFilePath);

      const extension = getExtension(fileName);
      if (extension === "zip" || extension === "tar" || extension === "gz") {
        try {
          await extract(tempFilePath, { dir: destFilePath });
        } catch (error) {
          throw new Error(error);
        }
      }
    } else if (operation.action === "run") {
      await shell.openExternal(tempFilePath);
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
        fs.unlinkSync(fileName);
      } catch (error) {
        console.log("file to delete is not present");
      }
    } else if (operation.action === "run") {
      // run a file in local temp directory
      const filePath = `${parentPath}\\${fileName}`;
      await shell.openExternal(filePath);
    }
  }
  return;
};
