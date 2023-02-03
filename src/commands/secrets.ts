import { Toolbox } from '@cipherstash/gluegun/build/types/domain/toolbox';
import DevctlConfig, { SecretsEntry } from '../types/config.mjs';
import Bluebird from 'bluebird'
import deepmerge from 'deepmerge';
import { resolve } from 'path'

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
interface VaultSecretsEntry extends SecretsEntry {
  config: VaultConfig;
  entries?: {
    default?: VaultEntryItem[];
    [envKey: string]: VaultEntryItem[];
  };
  files?: {
    default?: VaultFileItem[];
    [envKey: string]: VaultFileItem[];
  }
}

async function processSecretEntries(entries, options) {
  return Bluebird.reduce(entries, async (content, { name, key },) => {
    const { system, binary, endpoint } = options;

    const [keyString, version] = key.split('@');
    const [keyPath, jsonPath] = keyString.split(':');
    const raw = await system.run(`${binary} kv get -format=json -field=data -version=${version} ${keyPath}`, {
      env: { ...process.env, VAULT_ADDR: endpoint }
    });
    const parsed = JSON.parse(raw);

    if (jsonPath === '*') {
      content[name] = parsed;
    } else {
      content[name] = parsed[jsonPath];
    }
    return content;
  }, {})
}
module.exports = {
  name: 'pull-secrets',
  description: 'Populate secrets',
  run: async (toolbox: Toolbox) => {
    ``
    const { config, system, print, filesystem } = toolbox;
    const { secrets, current, cwd } = config as DevctlConfig;

    if (!current) {
      // if current isn't set, run switch, then rerun pull secrets
      await require('../cli').run('switch-current');
      return require('../cli').run('pull-secrets');
    }

    const { environment } = current;

    // Check if secrets is configured.
    if (!secrets) {
      print.info('No `secrets` configured.');
      process.exit(0);
    }

    const populatedSecrets = {};

    await Bluebird.map(secrets, async secret => {
      const { provider, prefix } = secret;
      if (provider == 'vault') {
        const { config, entries, files } = secret as VaultSecretsEntry;

        const { binary, loginArgs, endpoint } = {
          binary: 'vault',
          loginArgs: ['login'],
          endpoint: 'http://127.0.0.1:8200',
          ...config
        };
        // Check if vault binary exists.
        if (system.which(binary) === null) {
          print.error(
            'Please install the `vault` binary https://developer.hashicorp.com/vault/docs/install.'
          );
        }

        // Run login
        const login = await system.run(`${binary} ${loginArgs.join(' ')}`, {
          env: { ...process.env, VAULT_ADDR: endpoint }
        });

        let secretEntries = {};

        // Default entries
        if ('default' in entries) {
          secretEntries = await processSecretEntries(entries['default'], { system, binary, endpoint })
        }

        // Deep merge env entries
        if (environment in entries) {
          const envEntries = await processSecretEntries(entries[environment], { system, binary, endpoint })
          secretEntries = deepmerge(secretEntries, envEntries);
        }

        if ('default' in files) {
          for await (const { path, key } of files['default']) {
            const [keyString, version] = key.split('@');

            const raw = await system.run(`${binary} kv get -format=json -field=data -version=${version} ${keyString}`, {
              env: { ...process.env, VAULT_ADDR: endpoint }
            });

            filesystem.write(resolve(cwd, path), raw);
          }
        }

        if (environment in files) {
          for await (const { path, key } of files[environment]) {
            const [keyString, version] = key.split('@');

            const raw = await system.run(`${binary} kv get -format=json -field=data -version=${version} ${keyString}`, {
              env: { ...process.env, VAULT_ADDR: endpoint }
            });

            filesystem.write(resolve(cwd, path), raw);
          }
        }

        populatedSecrets[prefix] = secretEntries;
      }

      filesystem.write(config.paths.secrets, populatedSecrets);
    });

    return;
  },
};
