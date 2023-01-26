const get = require('lodash/get');

const { print } = require('@cipherstash/gluegun');

const {
  createDockerComposeCommand,
  writeComposeFileToHomeDir,
} = require('../utils/dockerCompose');

const { readScripts, runScripts } = require('../utils/runScripts');

module.exports = {
  name: 'up',
  description: `Builds, creates, starts, and attaches to containers for a service`,
  run: async toolbox => {
    const { config } = toolbox;
    const compose = get(config, 'paths.compose');
    const allScripts = await readScripts(get(config, 'paths.scripts'));

    await runScripts(allScripts, 'beforeSwitch', false);

    if (!compose) {
      console.log('compose :>> ', compose);
      return require('../cli').run('switch');
    }

    await runScripts(allScripts, 'afterSwitch', false);

    // shut down first!
    await require('../cli').run('down');

    // write it in the home folder of the users so that we can detect it if we switch project
    // and remove it
    await writeComposeFileToHomeDir(compose);

    const exec = createDockerComposeCommand(compose);

    // put it up!
    await exec({
      msg: `Starting docker containers ${print.colors.muted(
        `(This might take a while the first time)`
      )}`,
      cmd: 'up -d',
    });

    // show the status, but we're not done!
    await require('../cli').run('status');

    await runScripts(allScripts, 'start', true);

    return;
  },
};
