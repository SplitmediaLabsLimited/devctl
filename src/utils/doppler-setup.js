const { resolve } = require('path');
const get = require('lodash/get');
const bluebird = require('bluebird');
const { system, filesystem, print } = require('gluegun');

async function dopplerSetup(dopplers) {
  // Ensure that devctl still continues even if Doppler fails.
  try {
    await bluebird.map(dopplers, async item => {
      const { cwd, doppler } = item;

      await system.run(`doppler setup --no-interactive`, {
        cwd,
      });

      const files = Object.entries(get(doppler, 'files', {}));

      await bluebird.map(files, async file => {
        const [secret, destination] = file;

        const fullDestination = resolve(cwd, destination);

        const decoded = await system.run(
          `doppler secrets get ${secret} --plain`,
          {
            cwd,
          }
        );

        await filesystem.write(fullDestination, decoded);
      });
    });
  } catch (error) {
    print.warning('+++ WARNING: Failed to set up Doppler.');
    print.warning(error);
  }
}

module.exports = dopplerSetup;
