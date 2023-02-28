import { DevctlConfig, SecretsProviderEntry } from '../types/config.js';
import { SecretsProvider } from '../types/secrets.js';

export async function initSecretsProvider(
  entry: SecretsProviderEntry,
  config: DevctlConfig,
): Promise<SecretsProvider> {
  const { provider: providerString } = entry;
  const { provider } = await import(`./secrets/${providerString}.js`);

  return new provider(entry, config);
}
