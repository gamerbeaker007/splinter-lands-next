export interface SplPlayerAuthorities {
  name: string;
  require_active_auth?: boolean;
  authorities?: {
    rental?: string[];
    delegation?: string[];
    purchase?: string[];
  };
}
