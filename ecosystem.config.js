module.exports = {
  apps: [
    {
      name: "MainNodeServer",
      script: "server.js",
      cwd: ".",
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "UserLookerNextAPI",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 8001",
      cwd: "./website_sys/userlooker_sys/app",
    }
  ]
};
