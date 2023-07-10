import {
  DevctlConfig,
  SecretsConfig,
  SecretsProviderEntry,
} from '../../types/config.js';
import { SecretsProvider } from '../../types/secrets.js';
import Bluebird from 'bluebird';
import deepmerge from 'deepmerge';
import { resolve } from 'path';
import { filesystem } from '@cipherstash/gluegun';
import spawnAsync from "@expo/spawn-async";

interface VaultSecretsConfig extends SecretsConfig {
  binary: string;
  loginArgs: string[];
  endpoint: string;
}
interface VaultConfig {
  endpoint?: string;
  binary?: string;
  loginArgs?: string[];
}

interface VaultEntryItem {
  name: string;
  key: string;
}

interface VaultFileItem {
  path: string;
  key: string;
}

interface VaultSecretsProviderEntry extends SecretsProviderEntry {
  config: VaultConfig;
  entries: {
    default?: VaultEntryItem[];
    [envKey: string]: VaultEntryItem[];
  };
  files: {
    default?: VaultFileItem[];
    [envKey: string]: VaultFileItem[];
  }
}

class VaultSecretsProvider extends SecretsProvider {
  binary: string;
  loginArgs: string[];
  endpoint: string;

  kvGetCmd: string[];

  constructor(entry: VaultSecretsProviderEntry, devctl: DevctlConfig) {
    super(entry, devctl);
    this.entry = entry;
    this.devctl = devctl;

    this.configure(entry.config);
  }

  async configure(config: VaultConfig) {
    this.binary = config.binary ?? 'vault';
    this.loginArgs = config.loginArgs ?? ['login'];
    this.endpoint = config.endpoint;

    this.kvGetCmd = ['kv', 'get', '-format=json', '-field=data'];

  }

  async authenticate(): Promise<void> {
    try {
      console.log(`Token lookup...`)
      await spawnAsync(this.binary, ['token', 'lookup'], {
        env: { ...process.env, VAULT_ADDR: this.endpoint }
      });
    } catch (e) {
      console.log(`Token lookup failed. Authenticating...`)
      // Run login
      await spawnAsync(this.binary, [...this.loginArgs], {
        env: { ...process.env, VAULT_ADDR: this.endpoint }
      });
      console.log(`Token lookup failed. Authenticating... Done.`)
    }
  };

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

        let command = [];

        if (version === 'latest') {
          command = [...this.kvGetCmd, keyString];
        } else {
          command = [...this.kvGetCmd, `-version=${version}`, keyString];
        }

        const { stdout } = await spawnAsync(this.binary, command, {
          env: { ...process.env, VAULT_ADDR: this.endpoint }
        });

        filesystem.write(resolve(cwd, path), stdout);
      }
    }

    if (files && environment in files) {
      for await (const { path, key } of files[environment]) {
        const [keyString, version] = key.split('@');

        let command = [];
        if (version === 'latest') {
          command = this.kvGetCmd
        } else {
          command = [...this.kvGetCmd, `-version=${version}`, keyString];
        }

        const { stdout } = await spawnAsync(this.binary, command, {
          env: { ...process.env, VAULT_ADDR: this.endpoint }
        });

        filesystem.write(resolve(cwd, path), stdout);
      }
    }
  }

  async processSecretEntries(entries: VaultEntryItem[]) {
    return Bluebird.reduce(
      entries,
      async (content, { name, key }) => {

        const [keyString, version] = key.split('@');
        const [keyPath, jsonPath] = keyString.split(':');

        let command = [];
        if (version === 'latest') {
          command = [...this.kvGetCmd, keyPath];
        } else {
          command = [...this.kvGetCmd, `-version=${version}`, keyPath];
        }


        const execResult = await spawnAsync(this.binary, command, {
          env: { ...process.env, VAULT_ADDR: this.endpoint },
        });

        const parsed = JSON.parse(execResult.stdout);

        if (jsonPath === '*') {
          content[name] = parsed;
        } else {
          content[name] = parsed[jsonPath];
        }
        return content;
      },
      {}
    );
  }
}

export const provider = VaultSecretsProvider;
