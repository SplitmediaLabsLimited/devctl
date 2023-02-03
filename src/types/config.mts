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

export interface SecretsConfig { }

export interface SecretsEntry {
  prefix: string;
  provider?: string;
  config: SecretsConfig;
}

interface DevctlConfig {
  services?: ServicesConfigEntry[];
  secrets?: SecretsEntry[];
  environment?: EnvironmentConfigEntry[];
  current?: any;
  cwd?: string;
  paths?: {
    [key: string]: string[];
  };
}

export default DevctlConfig;
