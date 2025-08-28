const functions = require("firebase-functions");
const { default: next } = require("next");
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

// The Next.js server is initialized pointing to the built app in the parent directory
const server = next({
  dev: isDev,
  conf: { distDir: path.join('..', '.next') },
});

const nextHandle = server.getRequestHandler();

exports.nextServer = functions.https.onRequest(async (req, res) => {
  // Ensure the Next.js server is prepared before handling the request.
  await server.prepare();
  return nextHandle(req, res);
});
