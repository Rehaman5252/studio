const { onRequest } = require('firebase-functions/v2/https');
const { default: next } = require('next');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

const nextApp = next({
  dev: isDev,
  conf: {
    distDir: path.join('.next'),
  },
});
const nextHandle = nextApp.getRequestHandler();

exports.nextServer = onRequest({ maxInstances: 2 }, async (req, res) => {
  await nextApp.prepare();
  return nextHandle(req, res);
});
