export interface User {
  email: string | null;
  name: string | null;
  roles: string[];
  uid: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  passwordConfirmation: string;
  name: string | null;
}
