export interface Author {
  id: string;
  name: string;
  description: string;
  website: string;
  thumbnailUrl: string;
  sourceConfig: AuthorSourceConfig;
}

interface AuthorSourceConfig {
  github?: GithubOrgConfig;
  [source: string]: any;
}

interface GithubOrgConfig {
  id: number;
  name: string;
  type: "User" | "Organization";
  installed: boolean;
  installationId: number;
  admins: number[];
}
