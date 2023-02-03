const find = require('lodash/find');
const { resolve } = require('path');
const { get } = require('lodash');

function getCustomCommands(toolbox) {
  const { print } = toolbox;
  const commands = get(toolbox, 'commands', []);

  print.newline();
  print.info('Custom commands: ');
  print.newline();

  const mapped = commands.map(({ name, description, handler }) => {
    return {
      [name]: `${description} ${print.colors.muted(handler)}`,
    };
  });

  print.table(mapped);
}

module.exports = {
  name: 'devctl',
  hidden: true,
  run: async toolbox => {
    const { print } = toolbox;
    const { first } = toolbox.parameters;

    if (!first) {
      print.printHelp(toolbox);

      getCustomCommands(toolbox);

      print.newline();
      print.info('Running services: ');
      print.newline();
      await require('../cli').run('status');

      return;
    }

    const command = find(get(toolbox, 'commands'), { name: first });

    if (!command) {
      print.info(
        `Command ${print.colors.error(
          first
        )} does not exist. Available commands:`
      );

      print.printCommands(toolbox);

      process.exit(1);
    }

    const { cwd } = toolbox.config;
    const reqPath = resolve(cwd, command.handler);

    require(reqPath)(toolbox);

    return;
  },
};
