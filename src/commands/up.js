const get = require('lodash/get');

const { print } = require('gluegun');

const {
  createDockerComposeCommand,
  writeComposeFileToHomeDir,
} = require('../utils/dockerCompose');

module.exports = {
  name: 'up',
  description: `Builds, creates, starts, and attaches to containers for a service`,
  run: async toolbox => {
    const { config } = toolbox;

    const compose = get(config, 'paths.compose');

    if (!compose) {
      return require('../cli').run('switch');
    }

    // shut down first!
    await require('../cli').run('down');

    const exec = createDockerComposeCommand(compose);

    // put it up!
    await exec({
      msg: `Starting docker containers ${print.colors.muted(
        `(This might take a while the first time)`
      )}`,
      cmd: 'up -d',
    });

    // write it in the home folder of the users so that we can detect it if we switch project
    // and remove it
    await writeComposeFileToHomeDir(compose);

    // next step!
    return require('../cli').run('status');
  },
};
