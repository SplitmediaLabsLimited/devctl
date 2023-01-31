const os = require('os');
const Promise = require('bluebird');
const getPort = require('get-port');
const flatten = require('lodash/flatten');
const Docker = require('dockerode');
const { system, print } = require('@cipherstash/gluegun');
const get = require('lodash/get');
const { fstat, existsSync } = require('fs');
const path = require('path');

const DOCKER_CURL = 'spotify/alpine:latest';

function listDeviceIps() {
  const interfaces = os.networkInterfaces();

  return flatten(
    Object.keys(interfaces).map(interfaceName =>
      interfaces[interfaceName]
        // filter ipv6 and localhost
        .filter(
          i => (i.family === 'IPv4' || i.family === 4) && i.internal === false
        )
        // discard information we don't need
        .map(i => ({
          address: i.address,
          interfaceName,
        }))
    )
  );
}

function startServer(port) {
  return new Promise((resolve, reject) => {
    const http = require('http');

    const requestHandler = (req, res) => {
      res.end('ok');
    };

    const server = http.createServer(requestHandler);

    server.listen(port, err => {
      if (err) {
        return reject(err);
      }

      resolve(server);
    });
  });
}

async function isIpReachableInsideDocker(ip, port) {
  const socketPath = (function() {
    if (existsSync('/var/run/docker.sock')) {
      return '/var/run/docker.sock';
    }

    const home = path.join(os.homedir(), '.docker', 'run', 'docker.sock');

    if (existsSync(home)) {
      return home;
    }
  })();

  const docker = new Docker({ socketPath });

  const [output] = await docker.run(DOCKER_CURL, [
    'curl',
    '-m',
    '1',
    `http://${ip}:${port}`,
  ]);

  return get(output, 'StatusCode') === 0;
}

async function getReachableIP() {
  print.info(`Starting Docker IP Detection`);
  try {
    await system.run(`docker image inspect ${DOCKER_CURL}`);
    print.info(
      `docker image ${print.colors.success('✔')} ${print.colors.warning(
        DOCKER_CURL
      )} already exists`
    );
  } catch (err) {
    const spinner1 = print.spin(
      `Fetching ${print.colors.warning(DOCKER_CURL)} image`
    );
    await system.run(`docker pull ${DOCKER_CURL}`);
    spinner1.succeed();
  }

  const port = await getPort();
  const spinner2 = print.spin(
    `Starting dummy HTTP server on port ${print.colors.warning(
      port
    )} and fetch IP`
  );
  const server = await startServer(port);

  // check the list, and ping inside of docker to see if it's reachable
  const ips = await Promise.map(listDeviceIps(), async ip => {
    const reachable = await isIpReachableInsideDocker(ip.address, port);

    return {
      ...ip,
      reachable,
    };
  }).filter(ip => ip.reachable);

  spinner2.succeed();
  server.close();

  const ip = get(ips, [0]);
  const address = get(ip, 'address');

  print.info(
    `${print.colors.success(
      '✔'
    )} IP Reachable from inside Docker found: ${print.colors.warning(address)}.`
  );

  return ip;
}

async function getDockerHost(current) {
  const currentIp = get(current, 'dockerhost.address');

  // if there's no current IP, do the detection
  if (!currentIp) {
    return getReachableIP();
  }

  // if there's a saved one, make sure it still exists
  const filtered = listDeviceIps().filter(ip => ip.address === currentIp);

  return filtered[0] ? filtered[0] : getReachableIP();
}

module.exports = getDockerHost;
