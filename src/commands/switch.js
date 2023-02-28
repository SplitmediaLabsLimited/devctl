module.exports = {
  name: 'switch',
  description: `Switch services and/or environment`,
  run: async toolbox => {
    await require('../cli.js').run('switch-current ');
    await require('../cli.js').run('compile');

    process.exit(0);
    return;
  },
};
