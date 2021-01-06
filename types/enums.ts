// INSTALL ACTION ENUMS

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

export interface ButtonConfigEnum {
  [key: string]: ButtonConfig;
}

// PACKAGE OBJECT ENUMS

export enum PackageStatus {
  Active = "ACTIVE",
  Inactive = "INACTIVE"
}

export enum PackageVisibility {
  Public = "PUBLIC",
  Private = "PRIVATE"
}

export enum PackageSource {
  Github = "GITHUB",
  Azure = "AZURE",
  Url = "URL"
}

export enum PackageReleaseSetting {
  LatestAndPrerelease = "LATEST_AND_PRERELEASE",
  All = "ALL"
}
