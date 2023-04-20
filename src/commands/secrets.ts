import { GluegunToolbox } from '@cipherstash/gluegun';
import { DevctlConfig, SecretsProviderEntry } from '../types/config.js';
const Bluebird = require('bluebird');

module.exports = {
  name: 'pull-secrets',
  description: 'Populate secrets',
  run: async (toolbox: GluegunToolbox) => {
    const { initSecretsProvider } = await import('../lib/secrets.js');
    const { print, filesystem } = toolbox;
    const config: DevctlConfig = toolbox.config;
    const { secrets, current } = config;

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

    await Bluebird.map(secrets, async (secret: SecretsProviderEntry) => {
      const { prefix } = secret;
      const secretsProvider = await initSecretsProvider(secret, config);
      await secretsProvider.authenticate();

      populatedSecrets[prefix] = await secretsProvider.fetch(environment);

      await secretsProvider.generate(environment);
    });

    await filesystem.writeAsync(config.paths.secrets, populatedSecrets);
  },

};
