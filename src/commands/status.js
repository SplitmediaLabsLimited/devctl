const { print } = require('@cipherstash/gluegun');
const get = require('lodash/get');

module.exports = {
  name: 'status',
  description: `Output information about the current settings`,
  run: async toolbox => {
    const { config } = toolbox;

    const services = get(config, 'current.services', []);

    const table = [
      ['Service', 'Notes'],
      ...services.map(svc => {
        const service = config.services[svc];

        const note = get(service, 'notes', '')
          .split('\n')
          .map(line => {
            if (line.startsWith('    ')) {
              return print.colors.highlight(line);
            } else {
              return line;
            }
          })
          .join('\n')
          .trim();

        return [service.name, note];
      }),
    ];

    print.table(table, { format: 'lean' });
    return;
  },
};
