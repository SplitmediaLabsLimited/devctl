const get = require('lodash/get');

const {
  createDockerComposeCommand,
  getLastComposeFile,
} = require('../utils/dockerCompose');

module.exports = {
  name: 'down',
  description: `Stops containers and removes containers, networks, volumes, and images created by "up"`,
  run: async toolbox => {
    const { config } = toolbox;

    await (async () => {
      const lastCompose = await getLastComposeFile();
      if (!lastCompose) {
        return;
      }

      const exec = createDockerComposeCommand(lastCompose);

      await exec({
        msg: 'Shutting down previous instances',
        cmd: 'down --remove-orphans',
      });
    })();

    const compose = get(config, 'paths.compose');

    const exec = createDockerComposeCommand(compose);

    await exec({
      msg: 'Removing orphans container',
      cmd: 'down --remove-orphans',
    });

    return;
  },
};
