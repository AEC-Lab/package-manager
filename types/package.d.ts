import { PackageStatus, PackageVisibility, PackageSource, PackageReleaseSetting } from "./enums";

export interface Package {
  id: string;
  name: string;
  description: string;
  tags: string[];
  authorId: string;
  images: string[];
  status: PackageStatus;
  visibility: PackageVisibility;
  source: PackageSource;
  sourceData: GithubRepository | AzureRepository | UrlSource;
}

export interface GithubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  node_id: string;
  ownerId: number;
  installationId: number;
  releases: string[];
  releaseSetting: PackageReleaseSetting;
}

export interface AzureRepository {
  [key: string]: any;
}

export interface UrlSource {
  downloadUrl: string;
}
