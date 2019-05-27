const { print } = require('gluegun');
const { createDockerComposeCommand } = require('../utils/dockerCompose');
const { readYaml } = require('../utils/yaml');

async function showHelp(project) {
  print.info(
    `Run a one-off command on a service.. Shortcut for "docker-compose run"`
  );

  print.info('');
  print.info(
    `Usage: run [options] [-v VOLUME...] [-p PORT...] [-e KEY=VAL...] [-l KEY=VALUE...] SERVICE [COMMAND] [ARGS...]`
  );

  print.info('');
  print.info(`Available service`);
  const compose = await readYaml(project.paths.compose);
  const services = Object.keys(compose);
  services.map(name => {
    print.warning(` - ${name}`);
  });

  print.info(`
Options:
  -d, --detach          Detached mode: Run container in the background, print
                        new container name.
  --name NAME           Assign a name to the container
  --entrypoint CMD      Override the entrypoint of the image.
  -e KEY=VAL            Set an environment variable (can be used multiple times)
  -l, --label KEY=VAL   Add or override a label (can be used multiple times)
  -u, --user=""         Run as specified username or uid
  --no-deps             Don't start linked services.
  --rm                  Remove container after run. Ignored in detached mode.
  -p, --publish=[]      Publish a container's port(s) to the host
  --service-ports       Run command with the service's ports enabled and mapped
                        to the host.
  --use-aliases         Use the service's network aliases in the network(s) the
                        container connects to.
  -v, --volume=[]       Bind mount a volume (default [])
  -T                    Disable pseudo-tty allocation. By default \`docker-compose run\`
                        allocates a TTY.
  -w, --workdir=""      Working directory inside the container
  `);

  print.info('');
  print.info(`Try this command:`);
  print.warning(`devctl run ${services[0]} printenv`);
}

module.exports = {
  name: 'run',
  description: `Run a one-off command on a service`,
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
      cmd: `run ${params}`,
      options: {
        stdio: 'inherit',
      },
    });
  },
};
