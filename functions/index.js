
const functions = require("firebase-functions");
const { default: next } = require("next");
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

// The Next.js server is initialized without a custom distDir,
// allowing it to correctly locate the .next folder in a deployed environment.
const server = next({
  dev: isDev,
});

const nextHandle = server.getRequestHandler();

exports.nextServer = functions.https.onRequest({ maxInstances: 2 }, async (req, res) => {
  await server.prepare();
  return nextHandle(req, res);
});
