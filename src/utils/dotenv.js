function stringifyToEnv(obj) {
  return Object.keys(obj)
    .map(name => `${name}=${JSON.stringify(obj[name])}`)
    .join(require('os').EOL);
}

function parseEnv(env) {
  const obj = {};

  try {
    // Use \n since it's present for both *nix and windows .envs.
    // trim later to remove \r if needed
    const EOL = `\n`;

    const props = env.toString().split(EOL);

    props.map((row = '') => {
      const idx = row.indexOf('=');
      if (idx === -1) {
        return;
      }

      const key = row.substr(0, idx).trim();
      if (!key) {
        return;
      }

      const rawVal = row.substr(idx + 1).trim();

      try {
        obj[key] = JSON.parse(rawVal);
      } catch (e) {
        obj[key] = rawVal;
      }
    });
  } catch (e) {
    // noop
  }

  return obj;
}

module.exports = {
  stringifyToEnv,
  parseEnv,
};
