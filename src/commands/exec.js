const { print } = require('@cipherstash/gluegun');
const { createDockerComposeCommand } = require('../utils/dockerCompose');
const { readYaml } = require('../utils/yaml');

async function showHelp(project) {
  print.info(
    `Execute a command in a running container. Shortcut for "docker-compose exec"`
  );

  print.info('');
  print.info(`Usage: exec [options] [-e KEY=VAL...] SERVICE COMMAND [ARGS...]`);

  print.info('');
  print.info(`Available service`);
  const compose = await readYaml(project.paths.compose);
  const services = Object.keys(compose);
  services.map(name => {
    print.warning(` - ${name}`);
  });

  print.info(`
Options:
  -d, --detach      Detached mode: Run command in the background.
  --privileged      Give extended privileges to the process.
  -u, --user USER   Run the command as this user.
  -T                Disable pseudo-tty allocation. By default \`docker-compose exec\`
                    allocates a TTY.
  --index=index     index of the container if there are multiple
                    instances of a service [default: 1]
  -e, --env KEY=VAL Set environment variables (can be used multiple times,
                    not supported in API < 1.25)
  -w, --workdir DIR Path to workdir directory for this command.
  `);

  print.info('');
  print.info(`Try this command:`);
  print.warning(`devctl exec ${services[0]} sh`);
}

module.exports = {
  name: 'exec',
  description: `Execute a command in a running container`,
  run: async toolbox => {
    const { config, parameters } = toolbox;
    const { options } = parameters;

    const [, , , ...rawParams] = parameters.raw;
    const params = rawParams.join(' ');

    if (options.h || rawParams.length === 0) {
      return showHelp(config);
    }

    const exec = createDockerComposeCommand(config.paths.compose, false);

    exec({
      cmd: `exec ${params}`,
      options: {
        stdio: 'inherit',
      },
    });
  },
};
