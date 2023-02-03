import DevctlConfig from '../types/config.mjs';

const { cosmiconfig } = require('cosmiconfig');
const { resolve, dirname } = require('path');
const get = require('lodash/get');
const keyBy = require('lodash/keyBy');
const { readYaml } = require('../utils/yaml');

module.exports = async toolbox => {
  const { print } = toolbox;
  // reads the config
  toolbox.getProjectConfig = async (): Promise<DevctlConfig> => {
    const search = await cosmiconfig('devctl', {
      searchPlaces: [
        '.devctl.json',
        '.devctl.yaml',
        '.devctl.yml',
        '.devctlrc.json',
        '.devctlrc.yaml',
        '.devctlrc.yml',
        'package.json',
      ],
    }).search();

    if (!search) {
      print.info(
        `${print.colors.error(`error`)} devctl configuration not found`
      );

      return {};
    }

    const cwd = dirname(search.filepath);
    const paths = {
      project: search.filepath,
      compose: resolve(cwd, '.devctl-docker-compose.yaml'),
      current: resolve(cwd, '.devctl-current.yaml'),
      scripts: resolve(cwd, '.devctl-scripts.yaml'),
      secrets: resolve(cwd, '.devctl-secrets.yaml'),
    };

    const project = search.config;
    project.cwd = cwd;
    project.paths = paths;
    project.services = keyBy(project.services, 'name');
    project.environment = keyBy(project.environment, 'name');

    try {
      project.current = await readYaml(paths.current);
    } catch (err) {
      project.current = {};
    }

    try {
      project.compiledSecrets = await readYaml(paths.secrets);
    } catch (err) {
      project.compiledSecrets = {};
    }

    return project;
  };

  const projectConfig: DevctlConfig = await toolbox.getProjectConfig();

  toolbox.config = {
    ...toolbox.config,
    ...projectConfig,
  };

  toolbox.get = (key, def) => get(projectConfig, key, def);
};
