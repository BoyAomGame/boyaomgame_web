module.exports = {
  apps: [
    {
      name: "MainNodeServer",
      script: "server.js",
      cwd: ".",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
