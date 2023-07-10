import { GluegunToolbox } from '@cipherstash/gluegun';
import { DevctlConfig, SecretsProviderEntry } from '../types/config.js';
const Bluebird = require('bluebird');

module.exports = {
  name: 'pull-secrets',
  description: 'Populate secrets',
  run: async (toolbox: GluegunToolbox) => {
    console.log('Running pull-secrets');
    const { initSecretsProvider } = await import('../lib/secrets.js');
    const { print, filesystem } = toolbox;
    const config: DevctlConfig = toolbox.config;
    const { secrets, current } = config;

    if (!current) {
      // if current isn't set, run switch, then rerun pull secrets
      console.log('.devctl-current.yaml doesn\'t exist, creating...');
      await require('../cli').run('switch-current');
      return require('../cli').run('pull-secrets');
    }

    const { environment } = current;

    // Check if secrets is configured.
    if (!secrets) {
      print.info('No `secrets` configured.');
      return;
    }

    const populatedSecrets = {};

    await Bluebird.map(secrets, async (secret: SecretsProviderEntry) => {
      const { prefix } = secret;
      console.log(`Processing prefix \`${prefix}\`...`);
      const secretsProvider = await initSecretsProvider(secret, config);
      console.log(`Authenticating prefix \`${prefix}\`...`);
      await secretsProvider.authenticate();

      populatedSecrets[prefix] = await secretsProvider.fetch(environment);

      console.log(`Generating secrets for prefix \`${prefix}\`...`);
      await secretsProvider.generate(environment);
    });

    await filesystem.writeAsync(config.paths.secrets, populatedSecrets);
  },

};
