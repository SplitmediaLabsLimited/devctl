module.exports = {
  name: 'switch',
  description: `Switch services and/or environment`,
  run: async toolbox => {
    await require('../cli.js').run('pull-secrets');
    await require('../cli.js').run('switch-current');
    await require('../cli.js').run('compile');
    await require('../cli.js').run('up');

    process.exit(0);
    return;
  },
};
