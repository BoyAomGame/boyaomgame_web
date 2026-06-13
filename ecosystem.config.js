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
      name: "FriendTrack",
      script: "main.py",
      interpreter: "./friendtrack/.venv/bin/python",
      cwd: "./friendtrack",
      env: {
        FRIENDTRACK_DATA_DIR: "./data",
      }
    }
  ]
};
