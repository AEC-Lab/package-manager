import store from "../store";
import { PackageConfigLocal } from "../../types/config";
import { ButtonConfigEnum, ButtonActions } from "../../types/enums";
import { GenericObject } from "types/github";
import { Repository } from "types/repos";
import Vue from "../main";

export const getButtonConfig = (packageId: number) => {
  const existingInstall: PackageConfigLocal | undefined = store.state.config.localConfig.packages.find(
    (obj: PackageConfigLocal) => obj.packageId === packageId
  );
  const latestRelease = store.getters["github/getLatestRelease"](packageId);
  if (!latestRelease) return ButtonConfigs[ButtonActions.DISABLED]; // In reality there should be no packages without releases
  if (existingInstall) {
    if (existingInstall.releaseId === latestRelease.id) {
      return ButtonConfigs[ButtonActions.UNINSTALL];
    } else return ButtonConfigs[ButtonActions.UPDATE];
  } else return ButtonConfigs[ButtonActions.INSTALL];
};

export const installPackage = async (repository: Repository, release?: GenericObject) => {
  let releasePackage: GenericObject;
  if (!release) {
    releasePackage = await store.getters["github/getLatestRelease"](repository.id);
  } else releasePackage = release;
  if (!releasePackage) {
    throw new Error("No release found for this repository");
  }
  const { assets } = releasePackage;
  await Promise.all(
    assets.map(async (asset: GenericObject) => {
      const payload = {
        assetId: asset.id,
        releaseId: releasePackage.id,
        assetName: asset.name,
        repository: repository
      };
      return await store.dispatch("github/getAsset", payload);
    })
  );
  // TODO: ADD INSTALL FUNCTIONALITY HERE (reference .package file for instructions) //
  await store.dispatch("config/addOrUpdatePackage", {
    packageId: repository.id,
    releaseId: releasePackage.id
  });
};

export const uninstallPackage = async (repository: Repository) => {
  // TODO: ADD UNINSTALL FUNCTIONALITY HERE (reference .package file to take proper action (e.g. delete files/folders, run uninstall.exe, etc.))
  await store.dispatch("config/removePackage", repository.id);
};

export const ButtonConfigs: ButtonConfigEnum = {
  INSTALL: {
    text: "Install",
    color: "primary",
    handler: async (event: Event, repo: Repository) => {
      event.stopPropagation();
      try {
        await installPackage(repo);
        Vue.$snackbar.flash({ content: `Successfully installed ${repo.name}`, color: "success" });
      } catch (error) {
        Vue.$snackbar.flash({ content: `Error downloading ${repo.name} - ${error}`, color: "danger" });
      }
    }
  },
  UNINSTALL: {
    text: "Uninstall",
    color: "success",
    handler: async (event: Event, repo: Repository) => {
      event.stopPropagation();
      try {
        await uninstallPackage(repo);
        Vue.$snackbar.flash({ content: `Successfully uninstalled ${repo.name}`, color: "success" });
      } catch (error) {
        Vue.$snackbar.flash({ content: `Error uninstalling ${repo.name} - ${error}`, color: "danger" });
      }
    }
  },
  UPDATE: {
    text: "Update",
    color: "warning",
    handler: async (event: Event, repo: Repository) => {
      event.stopPropagation();
      try {
        await installPackage(repo);
        Vue.$snackbar.flash({ content: `Successfully updated ${repo.name}`, color: "success" });
      } catch (error) {
        Vue.$snackbar.flash({ content: `Error updating ${repo.name} - ${error}`, color: "danger" });
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
