const { build } = require('gluegun');
const { resolve } = require('path');
const node_modules = require('node_modules-path');

/**
 * Create the cli and kick it off
 */
async function run(argv) {
  // create a CLI runtime
  const cli = build()
    .brand('devctl')
    .src(__dirname)
    .plugins(node_modules(), { matching: 'devctl-*', hidden: false })
    .help() // provides default for help, h, --help, -h
    .version() // provides default for version, v, --version, -v
    .create();

  // and run it
  const toolbox = await cli.run(argv);

  // send it back (for testing, mostly)
  return toolbox;
}

module.exports = { run };
