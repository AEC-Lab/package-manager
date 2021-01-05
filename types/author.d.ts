export interface Author {
  id: string;
  name: string;
  sourceConfig: AuthorSourceConfig;
}

interface AuthorSourceConfig {
  github?: GithubOrgConfig;
  [source: string]: any;
}

interface GithubOrgConfig {
  id: number;
  name: string;
  admins: number[];
  private: boolean;
}
