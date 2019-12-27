const YAML = require('js-yaml');
const { filesystem, prompt } = require('gluegun');
const get = require('lodash/get');
const getDockerHost = require('../utils/getDockerHost');

async function askEnvironment(project) {
  if (Object.values(project.environment).length === 1) {
    return {
      environment: Object.values(project.environment)[0].name,
    };
  }

  return await prompt.ask({
    type: 'select',
    name: 'environment',
    message: 'Which environment do you want to use?',
    choices: Object.values(project.environment).map(env => ({
      name: env.name,
      message: env.name,
      hint: env.description,
      value: env.name,
    })),
    initial: get(project, 'current.environment', null),
  });
}

async function askServices(project) {
  const allChoices = Object.values(project.services)
    .map(service => ({
      name: service.name,
      message: service.name,
      hint: service.description,
      value: service.name,
      category: service.category,
    }))
    .sort(function(a, b) {
      const keyA = a.name.toLowerCase();
      const keyB = b.name.toLowerCase();
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    });

  const choices = allChoices.filter(c => c.category !== 'always');
  const choicesArray = choices.map(c => c.value);
  const always = allChoices
    .filter(c => c.category === 'always')
    .map(c => c.value);

  const initial = get(project, 'current.services', []).filter(c =>
    choicesArray.includes(c)
  );

  const { services } = await prompt.ask({
    type: 'multiselect',
    name: 'services',
    message: 'Which services do you want to work on?',
    choices,
    initial,
  });

  return { services: [...services, ...always] };
}

async function saveCurrentConfig(path, config) {
  return filesystem.write(path, YAML.dump(config));
}

module.exports = {
  name: 'switch',
  description: `Switch services and/or environment`,
  run: async toolbox => {
    const project = toolbox.config;

    const { services } = await askServices(project);

    const { environment } = await askEnvironment(project);

    const dockerhost = await getDockerHost(project.current);

    const currentConfig = {
      services,
      environment,
      dockerhost,
    };

    await saveCurrentConfig(project.paths.current, currentConfig);

    return require('../cli').run('compile');
  },
};
