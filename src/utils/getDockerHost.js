const os = require('os');
const Promise = require('bluebird');
const getPort = require('get-port');
const flatten = require('lodash/flatten');
const Docker = require('dockerode');
const { system, print } = require('gluegun');
const get = require('lodash/get');

const docker = new Docker();
const DOCKER_CURL = 'spotify/alpine:latest';

function listDeviceIps() {
  const interfaces = os.networkInterfaces();

  return flatten(
    Object.keys(interfaces).map(interfaceName =>
      interfaces[interfaceName]
        // filter ipv6 and localhost
        .filter(i => i.family === 'IPv4' && i.internal === false)
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
  const container = await docker.run(DOCKER_CURL, [
    'curl',
    '-m',
    '1',
    `http://${ip}:${port}`,
  ]);

  return container.output.StatusCode === 0;
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
    ip.reachable = await isIpReachableInsideDocker(ip.address, port);

    return ip;
  }).filter(ip => ip.reachable);

  spinner2.succeed();
  server.close();

  print.info(
    `${print.colors.success(
      '✔'
    )} IP Reachable from inside Docker found: ${print.colors.warning(
      ips[0].address
    )}.`
  );

  return ips[0];
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
