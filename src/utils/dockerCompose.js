const { filesystem, system, print } = require('gluegun');
const homedir = require('os').homedir();
const { execSync } = require('child_process');

const lastDCPath = filesystem.resolve(homedir, '.devctl-current');

async function getLastComposeFile() {
  const exists = await filesystem.exists(lastDCPath);

  if (!exists) {
    return null;
  }

  return filesystem.read(lastDCPath);
}

async function writeComposeFileToHomeDir(compose) {
  return filesystem.write(lastDCPath, compose);
}

function createDockerComposeCommand(compose, async = true) {
  return async ({ cmd, msg, options }) => {
    const command = `docker-compose -f ${compose} ${cmd}`;

    if (async) {
      const spinner = msg && print.spin(msg);
      try {
        const output = await system.run(command);
        msg && spinner.succeed();
        return output;
      } catch (err) {
        msg && spinner.fail(err.stderr);
        throw err;
      }
    }

    return execSync(command, options);
  };
}

module.exports = {
  createDockerComposeCommand,
  getLastComposeFile,
  writeComposeFileToHomeDir,
};
