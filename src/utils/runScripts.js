const get = require('lodash/get');
const Promise = require('bluebird');
const { system, print } = require('@cipherstash/gluegun');
const concurrently = require('concurrently');
const { readYaml } = require('./yaml');

async function exec({ cmd, msg, options }) {
  const spinner = msg && print.spin(msg);
  try {
    const output = await system.run(cmd);
    msg && spinner.succeed();
    return output;
  } catch (err) {
    msg && spinner.fail(err.stderr);
    throw err;
  }
}

async function readScripts(path) {
  try {
    return await readYaml(path);
  } catch (err) {
    return {};
  }
}

async function runScripts(allScripts, key, concurrent) {
  console.log('key :>> ', key);
  const scripts = get(allScripts, key, []);

  if (concurrent) {
    const concurrentScripts = scripts.map(({ name, scripts }) => {
      const [command] = scripts;
      return { command, name };
    });

    if (concurrentScripts.length === 0) {
      return;
    }

    print.spin(`Running ${print.colors.warning(key)} scripts`).stopAndPersist();

    await concurrently(concurrentScripts);
  } else {
    await Promise.map(scripts, async ({ name, scripts }) => {
      print
        .spin(`Running ${print.colors.warning(key)} scripts`)
        .stopAndPersist();

      await Promise.map(scripts, async cmd => {
        await exec({
          cmd,
          msg: ` ${print.colors.highlight(name)} ${cmd}`,
        });
      });
    });
  }
}

module.exports = {
  readScripts,
  runScripts,
};
