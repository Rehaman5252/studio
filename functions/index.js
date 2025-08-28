const functions = require("firebase-functions");
const { default: next } = require("next");
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

// The Next.js server is initialized without a custom distDir,
// as it's run from the functions directory and will look for .next
// in the parent directory.
const server = next({
  dev: isDev,
  conf: { distDir: path.join('..', '.next') },
});

const nextHandle = server.getRequestHandler();

exports.nextServer = functions.https.onRequest({ maxInstances: 2 }, async (req, res) => {
  await server.prepare();
  return nextHandle(req, res);
});
