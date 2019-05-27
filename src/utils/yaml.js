const YAML = require('js-yaml');
const { filesystem } = require('gluegun');

async function readYaml(path) {
  const raw = await filesystem.read(path);

  if (!raw) {
    return null;
  }

  return YAML.safeLoad(raw);
}

module.exports = {
  readYaml,
};
