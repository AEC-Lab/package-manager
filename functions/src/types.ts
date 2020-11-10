export interface User {
  email: string | null;
  name: string | null;
  roles: string[];
  uid: string;
}

export interface GenericObject {
  [key: string]: any;
}
