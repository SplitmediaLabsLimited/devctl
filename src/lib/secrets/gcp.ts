import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { DevctlConfig, Secret, SecretsConfig, SecretsProviderEntry } from '../../types/config';
import { SecretsProvider } from '../../types/secrets';
import Bluebird from 'bluebird';
import { parse } from "dotenv";
import deepmerge from 'deepmerge';
import { filesystem } from '@cipherstash/gluegun';
import { resolve } from 'path';

interface GCPSecretsConfig extends SecretsConfig {
  [environment: string]: {
    projectId: string
  }
}

class GCPSecretsProvider extends SecretsProvider {
  entry: SecretsProviderEntry;
  devctl: DevctlConfig;

  environment: string;
  projectId: string;
  secretsClient: SecretManagerServiceClient;

  async authenticate() {

  }

  async configure(config: GCPSecretsConfig) {
    const envConfig = {
      ...('default' in config ? config['default'] : {}),
      ...(this.environment in config ? config[this.environment] : {})
    };

    this.projectId = envConfig.projectId;
    this.secretsClient = new SecretManagerServiceClient({
      projectId: envConfig.projectId,
    });
  }

  async processSecretEntries(entries: Secret[]) {
    return Bluebird.reduce(
      entries,
      async (content, { key, name }) => {
        const [keyString, version] = key.split('@');
        const [keyPath, jsonPath] = keyString.split(':');

        const secretPath = this.secretsClient.secretVersionPath(this.projectId, keyPath, version);

        let secret;
        try {
          const [response] = await this.secretsClient.accessSecretVersion({ name: secretPath });
          secret = response?.payload?.data;
        } catch (e) {
          return content;
        }

        // Check if payload is JSON or env file, parse appropriately
        let parsed;
        try {
          parsed = JSON.parse(secret);
        } catch (e) {
          // It's not JSON, let's try to parse it as an env
          parsed = parse(secret);
        }

        if (jsonPath === '*') {
          content[name] = parsed;
        } else {
          content[name] = parsed[jsonPath];
        }

        return content;
      }, {});
  }
  async fetch(environment: string): Promise<Record<string, any>> {
    const { entries } = this.entry;

    let secretEntries: Record<string, any> = {};

    if ('default' in entries) {
      secretEntries = await this.processSecretEntries(entries['default']);
    }

    if (environment in entries) {
      const envEntries = await this.processSecretEntries(entries[environment]);
      secretEntries = deepmerge(secretEntries, envEntries);
    }


    return secretEntries;
  }
  async generate(environment: string) {
    const { files } = this.entry;
    const { cwd } = this.devctl;

    if (files && 'default' in files) {
      for await (const { path, key } of files['default']) {
        const [keyString, version] = key.split('@');

        const secretPath = this.secretsClient.secretVersionPath(
          this.projectId,
          keyString,
          version
        );

        let secret;
        try {
          const [response] = await this.secretsClient.accessSecretVersion({
            name: secretPath
          });
          secret = response?.payload?.data;
        } catch (e) {
          console.error(e);
          continue;
        }

        filesystem.write(resolve(cwd, path), secret);
      }
    }

    if (files && environment in files) {
      for await (const { path, key } of files[environment]) {
        const [keyString, version] = key.split('@');

        const secretPath = this.secretsClient.secretVersionPath(
          this.projectId,
          keyString,
          version
        );

        let secret;
        try {
          const [response] = await this.secretsClient.accessSecretVersion({
            name: secretPath
          });
          secret = response?.payload?.data;
        } catch (e) {
          console.error(e);
          continue;
        }

        filesystem.write(resolve(cwd, path), secret);
      }
    }
  }

  constructor(entry: SecretsProviderEntry, devctlConfig: DevctlConfig) {
    super(entry, devctlConfig);
    this.entry = entry;
    this.devctl = devctlConfig;
    this.environment = this.devctl.current?.environment;

    this.configure(entry.config);
  };
}

export const provider = GCPSecretsProvider