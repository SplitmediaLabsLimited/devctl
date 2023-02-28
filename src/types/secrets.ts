import { DevctlConfig, SecretsConfig, SecretsProviderEntry } from "./config.js";

export abstract class SecretsProvider {
  entry: SecretsProviderEntry;
  devctl: DevctlConfig;

  abstract authenticate();
  abstract configure(config: SecretsConfig);
  abstract fetch(environment: string): Record<string, any>;
  abstract generate(environment: string);

  constructor(entry: SecretsProviderEntry, devctlConfig: DevctlConfig) {
    this.entry = entry;
    this.devctl = devctlConfig;

    this.configure(entry.config);
  };
}