import store from "../store";
import { PackageConfigLocal } from "../../types/config";
import { ButtonConfigEnum, ButtonActions } from "../../types/enums";
import { GenericObject } from "types/github";
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

export const installPackage = async (pkg: Package, release?: GenericObject) => {
  let releasePackage: GenericObject;
  if (!release) {
    releasePackage = await store.getters["github/getLatestRelease"](pkg);
  } else releasePackage = release;
  if (!releasePackage) {
    throw new Error("No release found for this package");
  }
  const { assets } = releasePackage;
  await Promise.all(
    assets.map(async (asset: GenericObject) => {
      const payload = {
        assetId: asset.id,
        releaseId: releasePackage.id,
        assetName: asset.name,
        repository: pkg.sourceData
      };
      return await store.dispatch("github/getAsset", payload);
    })
  );
  // TODO: ADD INSTALL FUNCTIONALITY HERE (reference .package file for instructions) //
  await store.dispatch("config/addOrUpdatePackage", {
    packageId: pkg.id,
    releaseId: releasePackage.id
  });
};

export const uninstallPackage = async (pkg: Package) => {
  // TODO: ADD UNINSTALL FUNCTIONALITY HERE (reference .package file to take proper action (e.g. delete files/folders, run uninstall.exe, etc.))
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
        Vue.$snackbar.flash({ content: `Error downloading ${pkg.name} - ${error}`, color: "danger" });
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
        Vue.$snackbar.flash({ content: `Error uninstalling ${pkg.name} - ${error}`, color: "danger" });
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
        Vue.$snackbar.flash({ content: `Error updating ${pkg.name} - ${error}`, color: "danger" });
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
