export interface ServicesConfigEntry {
  name: string;
  path: string;
  description?: string;
  notes?: string;
}

export interface EnvironmentConfigEntry {
  name: string;
  description: string;
}

export type SecretsConfig = any;

export type Secret = {
  name: string;
  key: string;
}

export type SecretFile = {
  key: string;
  path: string;
}

export interface SecretsEntries {
  [environment: string]: Secret[];
}

export interface SecretsFiles {
  [environment: string]: SecretFile[];
}

export interface SecretsProviderEntry {
  prefix: string;
  provider?: string;
  config: SecretsConfig;
  entries: SecretsEntries;
  files: SecretsFiles;
}

export interface DevctlConfig {
  services?: ServicesConfigEntry[];
  secrets?: SecretsProviderEntry[];
  environment?: EnvironmentConfigEntry[];
  current?: any;
  cwd?: string;
  paths?: {
    [key: string]: string;
  };
}
