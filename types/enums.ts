import { installPackage, uninstallPackage } from "../src/utils/install";
import Vue from "../src/main";
import { Repository } from "types/repos";

export interface ButtonConfig {
  text: string;
  color: string;
  handler: Function;
}

export enum ButtonActions {
  INSTALL = "INSTALL",
  UNINSTALL = "UNINSTALL",
  UPDATE = "UPDATE",
  DISABLED = "DISABLED" // placeholder for erroneous packages, e.g. those without releases
}

interface ButtonConfigEnum {
  [key: string]: ButtonConfig;
}

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
