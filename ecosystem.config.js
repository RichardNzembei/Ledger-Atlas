module.exports = {
  apps: [
    {
      name: 'ledger-atlas-api',
      script: 'apps/api/dist/main.js',
      cwd: __dirname,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
      },
      instances: 1,
      max_memory_restart: '350M',
      exp_backoff_restart_delay: 100,
    },
  ],
}
