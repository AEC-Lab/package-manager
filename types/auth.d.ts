import { PackageConfigCloud } from "./config";
import { UserRole } from "./enums";

export interface User {
  email: string | null;
  name: string | null;
  roles: UserRole[];
  uid: string;
  config: PackageConfigCloud[];
  githubId?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  passwordConfirmation: string;
  name: string | null;
}
