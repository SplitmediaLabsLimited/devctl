const { print } = require('@cipherstash/gluegun');
const { createDockerComposeCommand } = require('../utils/dockerCompose');
const { readYaml } = require('../utils/yaml');

async function showHelp(project) {
  print.info(`View output from containers`);

  print.info('');
  print.info(`Usage: logs [options] [SERVICE...]`);

  print.info('');
  print.info(`Available service`);
  const compose = await readYaml(project.paths.compose);
  const services = Object.keys(compose);
  services.map(name => {
    print.warning(` - ${name}`);
  });

  print.info(`
Options:
  --no-color          Produce monochrome output.
  -f, --follow        Follow log output.
  -t, --timestamps    Show timestamps.
  --tail="all"        Number of lines to show from the end of the logs
                      for each container.
  `);

  print.info(
    `For example: ${print.colors.warning(`devctl logs -f -t ${services[0]}`)}`
  );
}

module.exports = {
  name: 'logs',
  description: `View output from containers`,
  run: async toolbox => {
    const { config, parameters } = toolbox;
    const { options } = parameters;

    const [, , , ...rawParams] = parameters.raw;
    const params = rawParams.join(' ');

    if (options.h) {
      return showHelp(config);
    }

    const exec = createDockerComposeCommand(config.paths.compose, false);

    exec({
      cmd: `logs ${params}`,
      options: {
        stdio: 'inherit',
      },
    });
  },
};
