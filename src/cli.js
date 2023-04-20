import { build } from '@cipherstash/gluegun';
import { dirname } from 'path';

/**
 * Create the cli and kick it off
 */
export async function run(argv) {
  // create a CLI runtime
  const cli = build()
    .brand('devctl')
    .src(__dirname)
    .plugins('node_modules', {
      matching: 'devctl-*',
      hidden: false,
    })
    .help() // provides default for help, h, --help, -h
    .version() // provides default for version, v, --version, -v
    .create();

  // and run it
  const toolbox = await cli.run(argv);

  // send it back (for testing, mostly)
  return toolbox;
}
