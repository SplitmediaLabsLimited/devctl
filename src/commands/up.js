const get = require('lodash/get');

const { print } = require('gluegun');

const {
  createDockerComposeCommand,
  writeComposeFileToHomeDir,
} = require('../utils/dockerCompose');

const dopplerSetup = require('../utils/doppler-setup');

const { readScripts, runScripts } = require('../utils/runScripts');

const { readYaml } = require('../utils/yaml');

module.exports = {
  name: 'up',
  description: `Builds, creates, starts, and attaches to containers for a service`,
  run: async toolbox => {
    const { config } = toolbox;

    const compose = get(config, 'paths.compose');

    if (!compose) {
      return require('../cli').run('switch');
    }

    const allScripts = await readScripts(get(config, 'paths.scripts'));
    await runScripts(allScripts, 'afterSwitch', false);

    const dopplers = await readYaml(get(config, 'paths.doppler'));
    await dopplerSetup(dopplers);

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
    require('../cli').run('status');

    await runScripts(allScripts, 'start', true);
  },
};
