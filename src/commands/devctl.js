module.exports = {
  name: 'devctl',
  hidden: true,
  run: async toolbox => {
    const { print } = toolbox;

    print.info('status');
  },
};
