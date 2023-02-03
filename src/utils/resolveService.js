const Promise = require('bluebird');
const { cosmiconfig } = require('cosmiconfig');
const { resolve } = require('path');
const get = require('lodash/get');
const { print } = require('@cipherstash/gluegun');
const deepmerge = require('deepmerge');

// generate each services' docker compose config
async function resolveService(project) {
  const services = await Promise.map(
    project.current.services,
    async svcName => {
      let service = project.services[svcName];

      // if there's no path, then it's the name of the folder
      if (!service.path) {
        service.path = svcName;
      }

      service.path = resolve(project.cwd, service.path);

      const search = await cosmiconfig('devconfig', {
        searchPlaces: [
          '.devconfig.yaml',
          '.devconfig.yml',
          '.devconfig.cjs',
          '.devconfig.js',
          '.devconfig.json',
        ],
      }).search(service.path);

      if (search === null) {
        print.info(
          `${print.colors.info(
            `info`
          )} cannot find devconfig file for service ${print.colors.warning(
            svcName
          )}, using empty default`
        );

        return service;

        // process.exit(1);
      }

      // resolve each service
      await Promise.map(Object.keys(search.config), async keyName => {
        const config = search.config[keyName];
        // if it's a function, pass the whole project config a
        if (typeof config === 'function') {
          service[keyName] = await config(project.current, project);
          return;
        }

        // if it reaches here, it's a YAML or JSON
        // we're going to merge stuff based on environments
        const defaultConfig = get(config, 'default', {});
        const envConfig = get(config, [project.current.environment], {});

        service[keyName] = deepmerge(defaultConfig, envConfig);
        return;
      });

      return service;
    }
  );

  return services;
}

module.exports = resolveService;
