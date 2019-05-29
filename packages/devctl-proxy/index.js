require('dotenv').config({ silent: true });

const get = require('lodash.get');

if (!process.env.DEVCTL_PROXY) {
  console.error('DEVCTL_PROXY env variable is not set');
  process.exit(1);
}

const parsed = JSON.parse(process.env.DEVCTL_PROXY);

const routes = get(parsed, 'routes', {});
const proxy = get(parsed, 'proxy', {});

if (!proxy.enabled) {
  console.log('Proxy not enabled');
  process.exit(1);
}

const routesKeys = Object.keys(routes);

function router(req) {
  const fullUrl = `${req.headers.host}${req.url}`;

  const match = routesKeys
    .filter(r => {
      return fullUrl.startsWith(r);
    })
    .reduce(function(a, b) {
      return a.length > b.length ? a : b;
    });

  return routes[match];
}

const express = require('express');
const app = express();

app.use(
  '/',
  require('http-proxy-middleware')({
    target: routesKeys[0],
    router,
    changeOrigin: true,
    ws: true,
    logLevel: 'warn',
  })
);

if (get(proxy, 'ssl.key') && get(proxy, 'ssl.cert')) {
  const ssl = get(proxy, 'ssl');

  require('https')
    .createServer(ssl, app)
    .listen(get(proxy, 'port', 443), _ => {
      console.log(`proxy started on ${get(proxy, 'port', 443)}`);
    });
}

require('http')
  .createServer(app)
  .listen(get(proxy, 'port', 80), _ => {
    console.log(`proxy started on ${get(proxy, 'port', 80)}`);
  });
