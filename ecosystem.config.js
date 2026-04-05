module.exports = {
  apps: [
    {
      name: "MainNodeServer",
      script: "server.js",
      cwd: ".",
      env: {
        NODE_ENV: "production",
        // Same host/port as UserLookerNextAPI (next start -p 8001)
        USERLOOKER_NEXT_URL: "http://127.0.0.1:8001",
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
