const Promise = require('bluebird');
const YAML = require('js-yaml');
const { filesystem } = require('gluegun');
const deepmerge = require('deepmerge');
const { stringifyToEnv, parseEnv } = require('../utils/dotenv');
const resolveService = require('../utils/resolveService');

const flatten = arr => [].concat(...arr).filter(a => !!a);

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
      finalDockerCompose = deepmerge(finalDockerCompose, compose || {});

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

    // scripts
    const afterSwitch = await Promise.map(services, async service => {
      const { afterSwitch = {}, name } = service;
      const scripts = Object.values(afterSwitch);
      if (scripts.length === 0) {
        return null;
      }

      return {
        name,
        scripts,
      };
    });

    const start = await Promise.map(services, async service => {
      const { start = {}, name } = service;
      const scripts = Object.values(start);
      if (scripts.length === 0) {
        return null;
      }

      return {
        name,
        scripts,
      };
    });

    await filesystem.write(
      get('paths.scripts'),
      YAML.dump({
        afterSwitch: flatten(afterSwitch),
        start: flatten(start),
      })
    );

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

      const httpPort = get('proxy.httpPort', 80);

      const environment = {
        DEVCTL_PROXY: JSON.stringify(
          {
            routes,
            proxy,
          },
          null,
          2
        ),
      };

      const ports = [`${httpPort}:${httpPort}`];

      if (get('proxy.ssl.cert') && get('proxy.ssl.key')) {
        const httpsPort = get('proxy.httpsPort', 443);
        ports.push(`${httpsPort}:${httpsPort}`);
      }

      finalDockerCompose['devctl-proxy'] = {
        image: 'splitmedialabs/devctl-proxy:latest',
        restart: 'always',
        ports,
        environment,
      };
    }

    // write the final docker-compose to a file in the cwd
    await filesystem.write(get('paths.compose'), YAML.dump(finalDockerCompose));

    // next step!
    return require('../cli').run('up');
  },
};
