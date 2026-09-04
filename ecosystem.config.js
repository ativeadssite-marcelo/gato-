module.exports = {
  apps: [
    {
      name: 'gato-api',
      cwd: './apps/api',
      script: 'node_modules/@nestjs/cli/bin/nest.js',
      args: 'start --watch',
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'gato-web',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev --port 3000',
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
