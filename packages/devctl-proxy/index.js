require('dotenv').config({ silent: true });

const get = require('lodash.get');

const { routes, proxy } = JSON.parse(process.env.DEVCTL_PROXY);

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
  const port = get(proxy, 'port', 443);

  require('https')
    .createServer(ssl, app)
    .listen(443, _ => {
      console.log(`proxy started on ${port}`);
    });
} else {
  const port = get(proxy, 'port', 80);

  require('http')
    .createServer(app)
    .listen(80, _ => {
      console.log(`proxy started on ${port}`);
    });
}
