module.exports = {
  name: 'switch-env',
  description: `Switch environments without running`,
  run: async (toolbox) => {
    await require('../cli.js').run('switch-current');
    await require('../cli.js').run('pull-secrets');
    await require('../cli.js').run('compile');

    process.exit(0);
    return;
  },
};
