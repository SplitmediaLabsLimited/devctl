const Promise = require('bluebird');
const { dirname } = require('path');
const { print, prompt } = require('@cipherstash/gluegun');

const databases = require('../utils/init-databases');

async function askEnv(database) {
  if (databases[database].env.length === 0) {
    return {};
  }

  const { env } = await prompt.ask({
    type: 'form',
    name: 'env',
    message: `Fill the configs for ${print.colors.warning(database)}`,
    choices: databases[database].env,
  });

  return env;
}

module.exports = {
  name: 'init',
  description: `Initialize projects and services for devctl`,
  run: async toolbox => {
    const { template } = toolbox;

    print.info(`Welcome to DevCTL!`);
    print.info(
      `This command will help you setup a basic devctl project. Advanced users will need to deep in the YAML files generated, and/or generate new ones.`
    );

    const { dbs } = await prompt.ask([
      {
        type: 'multiselect',
        name: 'dbs',
        required: true,
        message:
          'Select which databases you need locally. If you need something different, just choose a random one and modify its file afterward. ',
        choices: ['mongo', 'mysql', 'postgres', 'redis'],
      },
    ]);

    const response = await Promise.map(
      dbs,
      async database => {
        const { version } = await prompt.ask([
          {
            type: 'select',
            name: 'version',
            message: `Choose a version for ${print.colors.warning(database)}`,
            choices: databases[database].versions,
          },
        ]);

        const env = await askEnv(database);

        const target = `.devctl/${database}/.devconfig.yaml`;

        const generate = {
          template: 'database.devconfig.yaml.ejs',
          target,
          props: {
            ...databases[database].default,
            targetDir: dirname(target),
            database,
            version,
            env,
          },
        };

        await template.generate(generate);

        print.info(`${print.colors.highlight(target)} written.`);

        return generate;
      },
      {
        concurrency: 1,
      }
    );

    await template.generate({
      template: 'devctl.yaml.ejs',
      target: '.devctl.yaml',
      props: {
        values: response,
      },
    });

    print.info(`${print.colors.highlight('.devctl.yaml')} written.`);

    await template.generate({
      template: 'gitignore.ejs',
      target: '.gitignore',
      props: {
        values: response,
      },
    });

    print.info(`${print.colors.highlight('.gitignore')} written.`);

    print.success(``);
    print.success(`Your project has been successfully bootstrapped!`);
    print.info(
      `Please add these files in ${print.colors.highlight('.gitignore')}`
    );
    print.info(
      ` - .devctl-current.yaml ${print.colors.muted(
        `(This is your current state)`
      )}`
    );
    print.info(
      ` - .devctl-docker-compose.yaml ${print.colors.muted(
        `(This is your generated docker-compose file)`
      )}`
    );
    print.info(
      ` - .devctl/data ${print.colors.muted(
        `(This is where your databases will save state)`
      )}`
    );

    print.info('');
    print.success(
      `You can now run ${print.colors.highlight(
        'devctl switch'
      )} in this folder.`
    );
  },
};
