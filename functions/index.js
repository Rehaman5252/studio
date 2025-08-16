const functions = require("firebase-functions/v2/https");
const { default: next } = require("next");
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

// The standalone output is in .next/standalone/
// So we need to go up one directory from `functions`
const server = next({
  dev: isDev,
  conf: {
    distDir: path.join(__dirname, '../.next'),
  },
});

const nextHandle = server.getRequestHandler();

exports.nextServer = functions.onRequest({ maxInstances: 2 }, async (req, res) => {
  await server.prepare();
  return nextHandle(req, res);
});
