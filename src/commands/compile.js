const Promise = require('bluebird');
const YAML = require('js-yaml');
const { filesystem } = require('gluegun');
const { stringifyToEnv, parseEnv } = require('../utils/dotenv');
const resolveService = require('../utils/resolveService');

module.exports = {
  name: 'compile',
  hidden: true,
  run: async ({ config, get }) => {
    if (!config.current) {
      return require('../cli').run('switch');
    }

    // expand services by reading each services' config
    const services = await resolveService(config);

    let finalDockerCompose = {};
    await Promise.map(services, async service => {
      const { compose, dotenv, path } = service;

      // compile the final docker-compose
      finalDockerCompose = {
        ...finalDockerCompose,
        ...compose,
      };

      if (!dotenv) {
        return;
      }

      const dotenvPath = filesystem.resolve(path, '.env');

      let finalDotEnv = {};

      const exists = await filesystem.exists(dotenvPath);

      if (exists) {
        const raw = await filesystem.read(dotenvPath);
        finalDotEnv = parseEnv(raw);
      }

      finalDotEnv = {
        ...finalDotEnv,
        ...dotenv,
      };

      await filesystem.write(dotenvPath, stringifyToEnv(finalDotEnv));
    });

    if (get('proxy.enabled', false)) {
      // the user has enabled the proxy.

      const dockerhost = get('current.dockerhost.address');

      const routes = {};

      get('current.services', [])
        .map(svc => {
          return get(['services', svc, 'proxy']);
        })
        .filter(i => !!i)
        .forEach(proxies => {
          proxies.forEach(proxy => {
            const { port, protocol = 'http', paths } = proxy;

            paths.forEach(path => {
              routes[path] = `${protocol}://${dockerhost}:${port}`;
            });
          });
        });

      const proxy = get('proxy');

      if (get('proxy.ssl.key')) {
        proxy.ssl.key = await filesystem.read(
          filesystem.resolve(get('cwd'), get('proxy.ssl.key'))
        );
      }

      if (get('proxy.ssl.cert')) {
        proxy.ssl.cert = await filesystem.read(
          filesystem.resolve(get('cwd'), get('proxy.ssl.cert'))
        );
      }

      const port = (function() {
        if (get('proxy.ssl.key') && get('proxy.ssl.cert')) {
          return get('proxy.port', 443);
        }

        return get('proxy.port', 80);
      })();

      const environment = {
        DEVCTL_PROXY: JSON.stringify({
          routes,
          proxy,
        }),
      };

      finalDockerCompose['devctl-proxy'] = {
        image: 'splitmedialabs/devctl-proxy:dev-test',
        restart: 'always',
        ports: [`${port}:${port}`],
        environment,
      };
    }

    // write the final docker-compose to a file in the cwd
    await filesystem.write(get('paths.compose'), YAML.dump(finalDockerCompose));

    // next step!
    return require('../cli').run('up');
  },
};
