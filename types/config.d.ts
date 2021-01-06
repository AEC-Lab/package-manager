interface PackageConfigCore {
  packageId: string;
  releaseId: string;
}

export interface PackageConfigCloud extends PackageConfigCore {
  computerId: string;
}

export interface PackageConfigLocal extends PackageConfigCore {
  [key: string]: any;
}

export interface PackageConfigFile {
  version: string;
  packages: PackageConfigLocal[];
}
