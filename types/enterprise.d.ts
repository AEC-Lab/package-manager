import { EnterprisePackageAccess } from "./enums";

export interface Enterprise {
  id: string;
  name: string;
  memberDomains: string[];
  externalMembers: string[];
  packageConfig: EnterprisePackageConfig;
  memberConfig: EnterpriseMemberConfig;
  imageUrl: string;
}

export interface EnterprisePackageConfig {
  [key: string]: EnterprisePackageAccess;
}

export interface EnterpriseMemberConfig {
  [key: string]: string[];
}

export interface EnterprisePackageRequest {
  enterpriseId: string;
  created: Date;
}
