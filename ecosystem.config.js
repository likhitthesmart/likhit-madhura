// PM2 — bare-metal alternative to Docker (build both apps first)
module.exports = {
  apps: [
    {
      name: "madhura-api",
      cwd: "./apps/api",
      script: "dist/index.js",
      env: { NODE_ENV: "production", PORT: 4000 },
      instances: 1,
      autorestart: true,
    },
    {
      name: "madhura-web",
      cwd: "./apps/web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: { NODE_ENV: "production", API_URL: "http://127.0.0.1:4000" },
      instances: 1,
      autorestart: true,
    },
  ],
};
