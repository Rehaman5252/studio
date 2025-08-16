const functions = require("firebase-functions");
const { default: next } = require("next");
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

const server = next({
  dev: isDev,
  conf: {
    distDir: path.join(__dirname, '../.next'),
  },
});

const nextHandle = server.getRequestHandler();

exports.nextServer = functions.https.onRequest({ maxInstances: 2 }, async (req, res) => {
  await server.prepare();
  return nextHandle(req, res);
});
